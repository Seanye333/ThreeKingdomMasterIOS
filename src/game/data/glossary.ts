/**
 * 概念 — a plain-language glossary of the game's core mechanics, for players new
 * to grand strategy or to the Three Kingdoms. Distinct from the 列傳
 * encyclopedia (which catalogues officers/items/events): this explains *systems*
 * — what 民忠 does, why 兵糧 matters, how 合縱 and 簒奪 work.
 */

export interface GlossaryTerm {
  zh: string;
  en: string;
  descZh: string;
  descEn: string;
}

export interface GlossaryCategory {
  zh: string;
  en: string;
  icon: string;
  terms: GlossaryTerm[];
}

export const GLOSSARY: GlossaryCategory[] = [
  {
    zh: '內政', en: 'Domestic', icon: '🌾',
    terms: [
      { zh: '民忠', en: 'Loyalty', descZh: '一城百姓對你的歸心(0–100)。過低則民變、城池易主或武將離心。以「撫民」提升,重稅與徵兵會使其下降。', descEn: "A city's loyalty to you (0–100). Too low risks revolt, defection, or losing the city. Raise it with 撫民; heavy taxes and conscription lower it." },
      { zh: '兵糧', en: 'Grain', descZh: '養兵之糧,僅在秋收入庫,他季只支不入。城中或行軍中糧盡,士卒逃散。', descEn: 'Food that feeds your troops. It only comes in at the autumn harvest; other seasons are upkeep-only. Run out — in a city or on the march — and soldiers desert.' },
      { zh: '人口', en: 'Population', descZh: '城池的根本:決定稅收、農商產出,也是徵兵的來源。人口越多,可養之兵越多。', descEn: "A city's foundation: it drives tax, farm and trade output, and is the pool conscription draws from. More people, more soldiers you can field." },
      { zh: '徵兵 · 民怨', en: 'Conscription', descZh: '徵兵把百姓編入軍伍——減人口(抽丁數的兩倍),並按抽丁比例折損民忠。連年徵發須以撫民平衡,否則民心浮動。', descEn: 'Recruiting turns civilians into soldiers — it costs population (twice the troops raised) and dents loyalty by how hard you levy. Sustained recruiting must be balanced with 撫民.' },
      { zh: '稅率', en: 'Tax rate', descZh: '輕稅安民(入金少、民忠升),重稅充庫(入金多、民忠降),常制居中。視局勢取捨。', descEn: 'Light tax eases the people (less gold, rising loyalty); heavy tax fills the coffers (more gold, falling loyalty); normal sits between.' },
      { zh: '通脹', en: 'Inflation', descZh: '鑄小錢可即得大筆金,然通脹上揚,蝕日後稅入(漸消)。應急可用,長用傷本。', descEn: 'Debasing the coinage gives gold now but raises inflation, which saps future tax income (easing over time). An emergency lever, not a habit.' },
    ],
  },
  {
    zh: '軍事', en: 'Military', icon: '⚔',
    terms: [
      { zh: '補給線', en: 'Supply line', descZh: '出征之軍隨身帶糧,途中按兵數耗糧;糧盡則沿途逃兵(每季 10%)。遠征宜備足糧或以輜重接濟。', descEn: 'A marching army carries its own grain and burns it by headcount; once empty, it bleeds deserters (10%/season). Provision well or resupply by convoy.' },
      { zh: '輜重', en: 'Convoy', descZh: '城與城之間的運輸隊,運糧、金、兵。可被敵軍襲掠;設「常駐路線」可自動補給前線。', descEn: 'Supply carts hauling grain, gold or troops between cities. They can be raided; a 常駐路線 (standing route) auto-replenishes the front.' },
      { zh: '陣形', en: 'Formation', descZh: '戰場列陣之法(魚鱗、鶴翼、八卦…),各有攻防/機動取向且相剋。高智武將可用更精妙之陣。', descEn: 'Battle arrays (fish-scale, crane-wing, eight-trigrams…), each tilted to offence/defence/mobility and countering the others. Cleverer commanders unlock subtler ones.' },
      { zh: '兵種相剋', en: 'Arm counters', descZh: '槍剋騎、騎剋弓、弓剋槍;攻城器械破牆。臨陣選對兵種,事半功倍。', descEn: 'Spears beat cavalry, cavalry beats archers, archers beat spears; siege engines break walls. Match the arm to the moment.' },
      { zh: '圍困', en: 'Investment', descZh: '不強攻而圍城絕糧:守軍士氣日減、缺糧自潰。攻堅城時的耐心之選。', descEn: 'Besiege rather than storm: the garrison starves, morale bleeds, and the wall may fall without an assault. Patience against a strong fort.' },
      { zh: '士氣', en: 'Morale', descZh: '戰場上部隊的戰意,受創則降;歸零即潰逃。側翼、包夾、火攻都重創士氣。', descEn: "A unit's will to fight; it drops as it takes losses and routs at zero. Flanking, encirclement and fire all shatter it." },
    ],
  },
  {
    zh: '外交', en: 'Diplomacy', icon: '🕊',
    terms: [
      { zh: '互不侵犯', en: 'Non-aggression', descZh: '一段期間內雙方不得相攻的盟約,到期自動失效。為自己爭取時間之策。', descEn: 'A pact barring both sides from attacking for a set term, lapsing when it expires. Buys you breathing room.' },
      { zh: '同盟', en: 'Alliance', descZh: '更牢之邦交,關係深厚方能締結。可協同對敵,然背盟傷信譽。', descEn: 'A deeper bond, struck only on warm relations. Lets you act in concert — but breaking it stains your credibility.' },
      { zh: '信譽 · 積怨', en: 'Credibility & grudge', descZh: '信譽是你守約的名聲,背盟則降;積怨是對方對你的怨恨。二者皆影響日後外交的成敗。', descEn: 'Credibility is your reputation for keeping your word (breaking pacts lowers it); grudge is a rival\'s resentment of you. Both shape whether future overtures succeed.' },
      { zh: '合縱', en: 'Coalition', descZh: '一方坐大時,諸侯漸生戒心:彼此結盟、並與霸主絕交,合力相抗。你若成霸主,亦將親見天下合縱抗己。', descEn: 'When one power runs away with the realm, the lesser lords draw together — allying with each other and shedding pacts with the hegemon. Become the hegemon yourself and you will face the same.' },
    ],
  },
  {
    zh: '人物', en: 'Officers', icon: '👤',
    terms: [
      { zh: '忠誠', en: 'Officer loyalty', descZh: '武將對你個人的忠心。低則易被策反、出走或叛離。賞賜、官爵、因緣可固其心。', descEn: "An officer's personal loyalty to you. Low loyalty invites poaching, defection or betrayal. Rewards, rank and bonds shore it up." },
      { zh: '威望 · 官爵', en: 'Prestige & rank', descZh: '威望以戰功積累,影響武力/收入;官爵是你授予的職位。才高而位卑者易生不滿。', descEn: 'Prestige accrues from deeds and boosts power/income; rank is the post you grant. A great talent left under-ranked grows resentful.' },
      { zh: '因緣 · 結義', en: 'Bonds', descZh: '武將間的羈絆。同處共事日久可結義為盟,並肩作戰有加成;羈絆亦影響忠誠與招攬。', descEn: 'Ties between officers. Serving side by side can forge sworn bonds, giving combat bonuses; bonds also sway loyalty and recruitment.' },
      { zh: '在野', en: 'Unaffiliated', descZh: '尚未仕一主的賢才,隱於城邑之間。遣使招攬可納入麾下,先到先得。', descEn: 'Worthies who serve no lord yet, lingering in the cities. Send to recruit them before a rival does.' },
    ],
  },
  {
    zh: '權謀', en: 'Intrigue', icon: '🩸',
    terms: [
      { zh: '野心', en: 'Ambition', descZh: '懷野心(或傲)之將,若忠誠低落又久懷宿怨,可能反主。「忠」者永不背叛。', descEn: 'An ambitious (or arrogant) general whose loyalty has rotted and whose grievances have piled up may turn on his lord. The loyal never betray.' },
      { zh: '割據', en: 'Breakaway', descZh: '不滿之將據其所守之城自立旗號,脫離原勢力另成一家,並拉走同城心腹。', descEn: 'A discontented general raises his own banner at the city he holds, seceding into a new force and dragging close sympathisers along.' },
      { zh: '簒奪', en: 'Usurpation', descZh: '才望遠勝弱主的大將,可廢主自代,奪取整個勢力(如司馬代魏)。你的君位不會被簒,但邊城可能被割據奪走。', descEn: 'A general who eclipses a weak lord may cast him out and seize the whole force (as the Simas took Wei). Your own throne can never be usurped — but a slighted general may break a border province away.' },
      { zh: '諜報', en: 'Espionage', descZh: '潛入敵境的手段:刺探、煽動民變、焚糧、離間、暗殺、策反。成敗繫於諜者智謀與目標警覺。', descEn: 'Covert operations against a rival: gather intel, incite unrest, burn grain, sow discord, assassinate, induce defection. Success rides on your agent\'s wits versus the target\'s vigilance.' },
    ],
  },
  {
    zh: '天下', en: 'The Realm', icon: '🏯',
    terms: [
      { zh: '天命', en: 'Mandate of Heaven', descZh: '一方政權的正當性。天命高則民心歸附、政令通行;失德則天命漸去。', descEn: 'The legitimacy of a regime. High mandate draws the people and smooths your edicts; misrule lets it slip away.' },
      { zh: '結局', en: 'Endings', descZh: '通往青史的數種結局:天下統一、霸道一統、漢室再興、霸業(非劉據三京)、三國鼎立、隱士退隱、即位稱帝、久御四海。各有達成之道。', descEn: 'Several roads into the chronicles: Unify the realm, Unification by the Sword, Restore the Han, Hegemon (a non-Liu holding the three capitals), the Three Kingdoms, the Recluse, Enthronement, and Outlasting the Age — each with its own path.' },
    ],
  },
];
