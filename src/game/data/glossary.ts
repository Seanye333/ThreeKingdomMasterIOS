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
    zh: '軍略新篇', en: 'New Arts of War', icon: '🗺',
    terms: [
      { zh: '長圍(圍城)', en: 'Siege (map)', descZh: '紮營於敵城 45px 內、兵≥3000 可下「圍城」(在途部隊面板):每旬城中糧 −(守軍×0.8+人口×0.004)、民忠 −2;糧盡且圍軍≥守軍八成 → 開城出降,兵不血刃(舊臣半數就擒)。守軍多於圍軍 1.3 倍時每旬五成傾城突圍,打贏當旬解圍;援軍攔截圍軍亦解。AI 兵臨堅城同樣會圍你。', descEn: 'Camp within reach of an enemy city (3000+ troops) and INVEST it: its food and loyalty bleed each turn; dry granaries open the gates without a fight. A much larger garrison may sortie and rout you; relief columns lift the siege. The AI does it back.' },
      { zh: '設伏', en: 'Ambush stance', descZh: '紮營於掩蔽之地(林/丘/山道)可再下「設伏」:敵圖上整支軍隱形(遭遇預告亦不洩),敵縱隊撞入時伏擊加成 0.45(明營 0.3)且識破減半;親征遇伏,伏方免費帶「伏兵」戰前準備。AI 分遣隊亦會入伏。', descEn: 'A camp in cover can go to ground: invisible on the enemy map, springing harder on contact. AI detachments do the same.' },
      { zh: '斥候偵騎', en: 'Scouts', descZh: '行軍縱隊日流中逐日偵查前路:主將智力決定半徑與識破率(急行軍減半、緩進加半)。揭破的敵伏標紅「⚠伏」現形於圖、入預告,接戰時識破≥50%。破伏之道:緩進+智將。', descEn: "Marching columns scout day by day (commander INT drives it; cautious pace scouts half again as well). Flushed ambushes show on your map and are half-read on contact." },
      { zh: '兵站', en: 'Supply depot', descZh: '寨柵選單施設(320 金,木朽 16 季):補給色帶通至己方兵站即算連通 — 遠征前沿鋪兵站鏈即可深入;兼為過境友軍每半月回 +60 兵。可被敵攻拔;擴張型 AI 亦建。', descEn: 'A buildable supply anchor: the paint ribbon only has to reach a friendly depot chain, not walk home. Enemies can storm it.' },
      { zh: '糧道色帶', en: 'Supply ribbon', descZh: '行軍縱隊沿路把格子染成己色(帶一圈鄰格);2 季以上遠征須有己色連續帶通回友城/兵站,被踩斷/還草(4 季)/母城陷落 → 每旬 −7% 兵。糧道疊圖一鍵總覽全軍走廊(斷線閃紅)。', descEn: 'Columns paint the hexes they walk; a deep expedition must stay connected through its own colour or it starves 7%/turn. The SUPPLY overlay shows every corridor at once.' },
      { zh: '攔江鎖', en: 'River boom', descZh: '臨江之城可橫鐵鎖於水面(500 金):敵水軍過境每半月 70% 攔停,陸軍不受阻。反制「火炬燒鎖」:舟師臨鎖 −300 金即熔(AI 艦隊亦會燒你的鎖)。', descEn: 'Chain the river: hostile fleets stall 70%/half-month. Counter with torch-rafts (−300g) — the AI will burn yours too.' },
      { zh: '焚橋斷渡', en: 'Burn the crossing', descZh: '臨河縱隊一鍵焚毀近旁渡口:蓋 4 季「斷渡」戰痕,此地開戰時橋樑已斷 — 撤退斷追兵、守險斷敵路。守河 AI 見敵近亦會自焚渡口。', descEn: 'Torch the ford beside your column: battles here open with the span down for ~a year. Retreat cover, or denial.' },
      { zh: '會戰', en: 'Converging battle', descZh: '互動戰開打時,90px 內交戰雙方(及其同盟)的在途縱隊按真實方位入場助陣:每側至多 2 支、依距 3/5/7 回合到;倖存者戰後寫回地圖軍團。圍城戰自然滾成解圍會戰。', descEn: 'Columns (and allies!) near a battle ride to the drums, entering from their true bearings mid-fight; survivors return to the map.' },
      { zh: '烽火連天', en: 'Beacon chain', descZh: '敵軍犯境且邊城建有「烽燧」時,警訊沿己方烽燧鏈逐座點燃直傳都城(只有帶烽燧的城接得住火)— 烽燧線佈到哪,警報傳到哪。', descEn: 'Raise beacons on the frontier: alarms relay station-to-station to your capital, fire by fire.' },
      { zh: '戰場烙印', en: 'Battle scars', descZh: '戰鬥中燒毀的森林(焦土 8 季)與焚斷的橋(斷渡 4 季)回寫大地圖:棋盤變色、同一片地再開戰直接承襲(林已燼無從設伏、渡口仍斷)。', descEn: 'Forests torched and bridges dropped in battle scar the WORLD map; new battles over the same ground inherit them.' },
      { zh: '潰軍', en: 'Rout', descZh: '野戰/出擊/攻城敗北後,殘軍≥400 且有城可歸者不再原地蒸發 — 化為圖上「潰」軍,亡命奔往最近友城(1–3 季):不受號令、不奪土、每季再散 8% 卒;奔抵歸城則併入守軍(民忠 −2)。殘軍不足或無城可歸 → 就地星散。', descEn: 'A beaten army with 400+ survivors and a city to run to becomes a ROUT on the map: it flees to the nearest friendly city over 1–3 seasons, answers to no orders, claims no ground, sheds 8% a season, and folds into the garrison on arrival (−2 loyalty). Fewer survivors simply scatter.' },
      { zh: '掩殺收降', en: 'Ride down a rout', descZh: '潰軍無力再戰:敵行軍縱隊撞上(或潰軍路過敵城,守軍≥4000 出城)即成「掩殺」— 基準斬獲 55%(獵方有「追撃」技 +15%),斬獲三成就地收降入己軍/守城;潰軍餘部 <300 即覆滅,敵將各 35% 就擒(成就「追亡逐北」)。「邀擊」潰軍是主動獵殺之法。', descEn: 'Routs cannot fight back: any hostile column or garrison that catches one cuts it down — 55% slain per strike (+15% with the Pursuit skill), 30% of the kill pressed into your ranks, officers captured if the rout is wiped out. Use INTERCEPT to hunt one actively.' },
      { zh: '殿軍斷後', en: 'Rear guard', descZh: '敗軍中有「殿軍」之將(技或性格,趙雲/曹洪/周泰/廖化輩)則斷後死戰:潰時折損 ×0.8、被掩殺斬獲 ×0.6、同袍被擒率減半 — 而殿軍之將本人必殺出重圍,不遭生擒。', descEn: "A REAR-GUARD officer (skill or trait — think Zhao Yun) covers the flight: rout losses ×0.8, pursuit kills ×0.6, comrades' capture odds halved — and the rear guard himself always cuts his way out." },
    ],
  },
  {
    zh: '戰陣新篇', en: 'New Battlefield', icon: '🏯',
    terms: [
      { zh: '陣中築壘', en: 'Fieldworks', descZh: '戰鬥中任一步/騎/弓於開闊硬地花 2 AP 就地築壘:該格受擊 ×0.85、敵入格耗 2 步、騎兵衝鋒被鹿砦完全化解。木柵怕火 — 焚毀還為白地(一戰燒敵壘三座而勝 = 成就「火燒連營」)。AI 守方亦築。', descEn: 'Any unit can entrench open ground (2 AP): damage shield, slowed entry, cavalry charges broken. Burns like tinder.' },
      { zh: '城郭分層', en: 'Layered walls', descZh: '城壁強化(§內政令)所見即所戰:wallTier 2 攻城戰場多一道內城牆(門 HP600/牆 800),tier 3 主攻面再加護城河(唯門前橋道可渡)。攻堅城備攻城器或用水攻。', descEn: 'Wall upgrades appear IN the siege: tier 2 adds an inner ring, tier 3 a moat with one causeway.' },
      { zh: '區域天候', en: 'Regional weather', descZh: '戰場天氣按開戰地點修正:北國冬戰 45% 落雪、江南夏戰 35% 逢梅雨、西陲雨化風沙、秋日河域偶起晨霧。冬征河北與夏征江東是兩種仗。', descEn: 'Battle weather bends to WHERE you fight: northern winters snow, southern summers squall, the west dries the rain to dust.' },
      { zh: '入城三選', en: 'Conquest policy', descZh: '親征破城後一令定調:安民(民忠 +12)/犒軍(輕傷歸隊=攻方損失 15%,民忠 −3)/搜捕(舊臣各 40% 就擒,民忠 −8)。AI 破城亦按性格定調(暴君搜捕、文主安民)。', descEn: 'After storming a city in person, set the tone: pacify, reward the host, or hunt the old regime. AI conquerors pick by personality.' },
      { zh: '攻城戰損', en: 'Siege damage', descZh: '攻城結算逐建築擲損毀(陷城 20%/守住 8%/戰中用火 +12%):損毀建築零加成、城內 3D 焦黑冒煙,城建面板紅框「修繕」(40%×造價×等級)復原。攻下敵城常接手一片瘡痍。', descEn: 'Sieges wreck buildings; wrecked works give no bonus until repaired. Conquest usually hands you a fixer-upper.' },
    ],
  },
  {
    zh: '城邦新篇', en: 'New City Life', icon: '🏮',
    terms: [
      { zh: '街頭際遇', en: 'Street encounters', descZh: '每城每季至多一遇(35%):牌坊邊的 ✨人物 — 行商獻寶(300 金→馬 40 鐵 40 藥 20)/遊俠比武(最強武將得歷練+練度 3)/相士設壇(100 金→民忠 +4)/說書開講(民忠 +3)。婉拒也算過,本季不再遇。', descEn: 'Once a season a special figure may stand in the street: a caravan lot, a sparring knight, a soothsayer, a storyteller.' },
      { zh: '城中人物', en: 'Officers in town', descZh: '在城武將以人偶現於其所:文官府衙前、武官校場、已知在野之士在酒樓外(點擊直達互動);兜帽剪影=有未發現的賢士,搜索有戲。都城另有官邸,君主妻兒現於庭中。', descEn: 'Stationed officers stand where they would be found; hooded silhouettes hint at undiscovered talent. Your family lives at the capital residence.' },
      { zh: '民情街景', en: 'Civic streets', descZh: '城的境況寫在街上:民忠 <35% 道旁現流民(點之直達賑濟)、上季疫城掛白幡且人流減半、秋季民忠 >66% 大街張綵旗辦廟會、下旬月夜家家窗紙透光+打更人巡街。', descEn: "The town's condition shows in its streets: refugees, mourning banners, festivals — and lamplit windows on moonlit nights." },
    ],
  },
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
