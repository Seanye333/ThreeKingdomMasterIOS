import type { DialogueEvent } from '../types';

/**
 * Random dialogue events — roll a small chance each season for one of these
 * to fire. Most are flavor; a few have meaningful mechanical effects.
 *
 * The roller filters by year and optional flag/officer conditions, then
 * picks uniformly among the eligible.
 */
export const DIALOGUE_EVENTS: DialogueEvent[] = [
  // ─── 2026-07 補:三國風物趣聞(季度隨機) ───
  {
    id: 'dlg-old-soldier',
    speaker: { zh: '白髮老卒', en: 'A White-Haired Veteran' },
    text: { zh: '老卒撫刀而言:「某隨先主征戰三十年,今老矣,願為後輩講一講當年血戰。」', en: 'An old soldier strokes his blade: "Thirty years I marched with our late lord. I am old now — let me tell the young ones of the great battles."' },
    choices: [
      { label: { zh: '設宴聽其講古', en: 'Feast him, hear his tales' }, effects: [{ kind: 'gold', delta: -30 }, { kind: 'none' }], outcome: { zh: '滿營將士圍坐而聽,軍心一振。', en: 'The whole camp gathers to listen — morale lifts.' } },
      { label: { zh: '厚賜遣歸鄉里', en: 'Reward him, send him home' }, effects: [{ kind: 'gold', delta: -50 }], outcome: { zh: '老卒垂淚拜謝,鄉里傳為美談。', en: 'He bows in tears; the countryside sings your praise.' } },
    ],
  },
  {
    id: 'dlg-merchant-curio',
    speaker: { zh: '西域商賈', en: 'A Merchant of the West' },
    text: { zh: '胡商捧一琉璃盞而來:「此物來自大秦,舉世罕見,願獻於明公。」', en: 'A foreign trader offers a glass cup: "From distant Daqin, a rarity in all the world — I would present it to my lord."' },
    choices: [
      { label: { zh: '重金購之', en: 'Buy it at a high price' }, effects: [{ kind: 'gold', delta: -80 }], outcome: { zh: '珍玩入庫,一時傳為佳話。', en: 'The treasure enters your store — the talk of the season.' } },
      { label: { zh: '婉拒之', en: 'Politely decline' }, effects: [{ kind: 'none' }], outcome: { zh: '胡商悵然而去,另尋買主。', en: 'The trader sighs and seeks another buyer.' } },
      { label: { zh: '設市易以通商路', en: 'Open a market for the trade route' }, effects: [{ kind: 'gold', delta: 60 }], outcome: { zh: '胡商往來絡繹,關市之利歸府。', en: 'Traders flock in; the toll fills your treasury.' } },
    ],
  },
  {
    id: 'dlg-mad-scholar',
    speaker: { zh: '狂士', en: 'A Wild Scholar' },
    text: { zh: '一狂生披髮登堂,長揖不拜:「聞明公求賢若渴,某有安天下之策,肯聽否?」', en: 'A dishevelled scholar strides in, bowing but not kneeling: "They say you thirst for talent. I hold a plan to settle the realm — will you hear it?"' },
    choices: [
      { label: { zh: '虛心請教', en: 'Hear him out with respect' }, effects: [{ kind: 'none' }], outcome: { zh: '其言雖狂,頗有可採,士人聞之爭來。', en: 'Mad as he sounds, there is worth in it; scholars come flocking.' } },
      { label: { zh: '斥其無禮', en: 'Rebuke his insolence' }, effects: [{ kind: 'none' }], outcome: { zh: '狂士拂袖而去,士林頗有微詞。', en: 'He storms off; the literati grumble.' } },
    ],
  },
  {
    id: 'dlg-good-harvest',
    speaker: { zh: '田間老農', en: 'An Old Farmer' },
    text: { zh: '老農捧一株九穗之禾:「今歲風調雨順,田生嘉禾,一莖九穗,實為祥瑞!」', en: 'A farmer holds up a nine-eared stalk: "A kindly year — the fields bore an auspicious grain, nine ears on one stalk!"' },
    choices: [
      { label: { zh: '賞其勤,勸農桑', en: 'Reward him, promote farming' }, effects: [{ kind: 'gold', delta: -20 }, { kind: 'none' }], outcome: { zh: '農人爭相力田,倉廩漸實。', en: 'The peasants vie to till; the granaries swell.' } },
      { label: { zh: '獻嘉禾以彰德政', en: 'Present it as a sign of good rule' }, effects: [{ kind: 'none' }], outcome: { zh: '民以為天佑明主,人心大悅。', en: 'The people take it as Heaven\'s favour — hearts gladden.' } },
    ],
  },
  {
    id: 'dlg-children-song',
    speaker: { zh: '市井小兒', en: 'Children in the Street' },
    text: { zh: '市井忽傳一童謠,語涉興亡,街巷傳唱,人心浮動。', en: 'A children\'s rhyme spreads through the streets, hinting at rise and ruin; the people grow restive.' },
    choices: [
      { label: { zh: '查禁妖言', en: 'Ban the seditious song' }, effects: [{ kind: 'none' }, { kind: 'gold', delta: -20 }], outcome: { zh: '童謠漸息,然亦有畏禁而不敢言者。', en: 'The rhyme fades — though some now hold their tongues in fear.' } },
      { label: { zh: '順其自然', en: 'Let it run its course' }, effects: [{ kind: 'none' }], outcome: { zh: '童謠傳數日而自止。', en: 'The song passes of itself in a few days.' } },
      { label: { zh: '借謠以安民心', en: 'Turn the rhyme to your favour' }, effects: [{ kind: 'none' }], outcome: { zh: '巧為附會,反收攬眾之效。', en: 'Cleverly spun, it becomes a rallying cry instead.' } },
    ],
  },
  {
    id: 'dlg-rat-granary',
    speaker: { zh: '倉官', en: 'The Granary Officer' },
    text: { zh: '倉官惶恐來報:「府庫鼠患猖獗,囓壞糧秣不少,乞明公裁處。」', en: 'The granary officer reports anxiously: "Rats have overrun the stores and gnawed away much grain — I beg your judgment."' },
    choices: [
      { label: { zh: '增貓犬,修倉廩', en: 'Add cats and mend the stores' }, effects: [{ kind: 'gold', delta: -30 }, { kind: 'none' }], outcome: { zh: '鼠患漸除,倉儲得保。', en: 'The rats dwindle; the stores are secured.' } },
      { label: { zh: '罰倉官失職', en: 'Punish the officer' }, effects: [{ kind: 'none' }], outcome: { zh: '倉官受責,然損耗已成。', en: 'The officer is chastised, but the loss is done.' } },
    ],
  },
  {
    id: 'dlg-wandering-hero',
    speaker: { zh: '遊俠', en: 'A Wandering Blade' },
    text: { zh: '一壯士按劍而立:「某遊歷四方,慕明公之義,願提三尺劍,效死於麾下!」', en: 'A stalwart grips his sword: "I have roamed the four quarters and honour your righteousness — let me draw my blade in your service, to the death!"' },
    choices: [
      { label: { zh: '納之為士', en: 'Take him into your host' }, effects: [{ kind: 'gold', delta: -20 }], outcome: { zh: '壯士感激,招其鄉黨數百來投麾下。', en: 'Grateful, he brings hundreds of his fellows to enlist.' } },
      { label: { zh: '試其膽勇', en: 'Test his mettle first' }, effects: [{ kind: 'none' }], outcome: { zh: '壯士欣然受試,果有萬夫之勇。', en: 'He gladly takes the test — and proves the match of ten thousand.' } },
    ],
  },
  {
    id: 'dlg-master-smith',
    speaker: { zh: '名匠', en: 'A Master Smith' },
    text: { zh: '一老匠獻新鑄之刀:「某窮三年之功,得此利器,吹毛可斷,願獻明公。」', en: 'An old smith presents a fresh-forged blade: "Three years\' labour went into this — it cuts a floating hair. I offer it to my lord."' },
    choices: [
      { label: { zh: '厚賞,留匠於軍器坊', en: 'Reward him, keep him at the arsenal' }, effects: [{ kind: 'gold', delta: -60 }], outcome: { zh: '名匠留而督造,軍中利器漸精。', en: 'He stays to oversee the forges; your arms grow keener.' } },
      { label: { zh: '受刀而遣之', en: 'Accept the blade, send him off' }, effects: [{ kind: 'none' }], outcome: { zh: '寶刀入庫,匠人另投他處。', en: 'The blade is stored; the smith takes his craft elsewhere.' } },
    ],
  },
  {
    id: 'dlg-plague-warning',
    speaker: { zh: '醫者', en: 'A Physician' },
    text: { zh: '一遊方醫者進言:「觀近日天時乖戾,恐有疫氣將行,宜早為之備。」', en: 'A travelling physician warns: "The season\'s airs are ill-tempered — a pestilence may be coming. Best prepare early."' },
    choices: [
      { label: { zh: '施藥,掘井,清溝渠', en: 'Distribute medicine, dig wells, clear drains' }, effects: [{ kind: 'gold', delta: -50 }, { kind: 'none' }], outcome: { zh: '疫氣未起而備已周,民賴以安。', en: 'The plague never takes hold; the people rest easy.' } },
      { label: { zh: '斥為妄言', en: 'Dismiss it as nonsense' }, effects: [{ kind: 'none' }], outcome: { zh: '醫者搖首而去,但願其言不驗。', en: 'The physician leaves, shaking his head — one hopes he was wrong.' } },
    ],
  },
  {
    id: 'dlg-lost-classic',
    speaker: { zh: '藏書老儒', en: 'An Old Bibliophile' },
    text: { zh: '一老儒抱一卷殘書:「此乃先賢遺篇,兵農之要盡在其中,惜乎蟲蠹過半。」', en: 'An old scholar clutches a tattered scroll: "A lost work of the sages — the essence of war and husbandry is here, though the worms have had half of it."' },
    choices: [
      { label: { zh: '延儒補校,傳之後世', en: 'Have it restored and copied' }, effects: [{ kind: 'gold', delta: -40 }, { kind: 'none' }], outcome: { zh: '殘篇補全,藏之府庫,士林稱頌。', en: 'The gaps are filled and the work preserved — the scholars applaud.' } },
      { label: { zh: '厚酬購其書', en: 'Buy the scroll outright' }, effects: [{ kind: 'gold', delta: -60 }], outcome: { zh: '古卷入藏,老儒得酬而喜。', en: 'The scroll is yours; the old man departs content.' } },
    ],
  },
  {
    id: 'dlg-drunken-brawl',
    speaker: { zh: '報告係', en: 'Court Messenger' },
    text: {
      zh: '兩將酒席相爭。一方刃傷沙汰寸前。',
      en: 'Two of your generals brawled at a banquet — blades were nearly drawn.',
    },
    choices: [
      {
        label: { zh: '両者罰', en: 'Punish both' },
        effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '両者降格,軍規確立。', en: 'Both demoted. Discipline restored.' },
      },
      {
        label: { zh: '不問', en: 'Let it pass' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '醉漢相鬥，無甚要緊', en: 'Just drunkards quarreling. Forgotten by dawn.' },
      },
      {
        label: { zh: '沒收酒水', en: 'Confiscate the wine' },
        effects: [{ kind: 'gold', delta: 30 }],
        outcome: { zh: '酒水變賣,30金，入庫。', en: 'The wine was sold — 30 gold to the treasury.' },
      },
    ],
  },
  {
    id: 'dlg-omen-comet',
    speaker: { zh: '天文官', en: 'Court Astronomer' },
    text: {
      zh: '彗星出現，古云,「彗者，改之象也」。',
      en: 'A comet has appeared. The ancients say: "the broom-star foretells change."',
    },
    choices: [
      {
        label: { zh: '宣為吉兆', en: 'Proclaim it a good omen' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '民眾以為新世將至，喜形於色', en: 'The people rejoice — a new age begins!' },
      },
      {
        label: { zh: '黙殺', en: 'Ignore it' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '視為占星家妄言。', en: 'Dismissed as the astronomer\'s rambling.' },
      },
    ],
  },
  {
    id: 'dlg-bandit-offer',
    speaker: { zh: '使者', en: 'Messenger' },
    text: {
      zh: '山賊,金200，付則退前來。',
      en: 'A bandit chieftain offers to disperse his forces for 200 gold.',
    },
    choices: [
      {
        label: { zh: '払', en: 'Pay' },
        effects: [{ kind: 'gold', delta: -200 }],
        outcome: { zh: '山賊如約而退。', en: 'The bandits disperse — as promised, this time.' },
      },
      {
        label: { zh: '討伐', en: 'Hunt them down' },
        effects: [{ kind: 'troops', cityId: '', delta: -300 }],
        outcome: { zh: '討伐隊損耗,然而山賊根絶。', en: 'Casualties taken, but the bandits are gone.' },
      },
      {
        label: { zh: '無視', en: 'Ignore' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '將來,後悔亦未可知。', en: 'May come back to haunt you.' },
      },
    ],
  },
  {
    id: 'dlg-poet-gift',
    speaker: { zh: '老詩人', en: 'Old Poet' },
    text: {
      zh: '名之詩人,君主獻詩，前來敬獻。',
      en: 'A renowned poet has come to offer verses to your court.',
    },
    choices: [
      {
        label: { zh: '黄金報', en: 'Reward with gold' },
        effects: [{ kind: 'gold', delta: -100 }],
        outcome: { zh: '詩人欣喜,君主之名,傳於後世。', en: 'The poet is delighted. Your name will live in his verses.' },
      },
      {
        label: { zh: '僅奉茶', en: 'Just tea' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '詩人静帰。', en: 'The poet leaves quietly.' },
      },
    ],
  },
  {
    id: 'dlg-rain-pour',
    speaker: { zh: '農吏', en: 'Agriculture Official' },
    text: {
      zh: '今春,雨充沛。収穫之兆豐。',
      en: 'This spring has brought generous rains. The harvest will be bountiful.',
    },
    choices: [
      {
        label: { zh: '農夫，褒', en: 'Reward the farmers' },
        effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '農民之忠誠,目見上升。', en: 'Farmer loyalty rises visibly.' },
      },
      {
        label: { zh: '感謝之', en: 'Just thanks' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '農民感激吧。', en: 'The farmers will be satisfied.' },
      },
    ],
  },
  {
    id: 'dlg-orphan-petition',
    speaker: { zh: '孤児', en: 'Orphan' },
    text: {
      zh: '戰災孤児們宮殿之前聚集。狀甚悲憫。',
      en: 'Orphans of war gather at your palace gates — wretched.',
    },
    choices: [
      {
        label: { zh: '救済', en: 'Establish a relief fund' },
        effects: [{ kind: 'gold', delta: -150 }],
        outcome: { zh: '民之声,讚譽四起。', en: 'The people sing your praise.' },
      },
      {
        label: { zh: '追払', en: 'Have them driven away' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '民衆,失望。', en: 'The people are disappointed.' },
      },
    ],
  },
  {
    id: 'dlg-merchant-deal',
    speaker: { zh: '商人', en: 'Travelling Merchant' },
    text: {
      zh: '西域之商人,珍宝，兜售。',
      en: 'A merchant from the Western Regions offers rare treasures.',
    },
    choices: [
      {
        label: { zh: '購入', en: 'Buy' },
        effects: [{ kind: 'gold', delta: -300 }],
        outcome: { zh: '宝物國庫，飾。', en: 'The treasures enrich your court.' },
      },
      {
        label: { zh: '断', en: 'Decline' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '商人去。', en: 'The merchant moves on.' },
      },
    ],
  },
  {
    id: 'dlg-wandering-monk',
    speaker: { zh: '行脚僧', en: 'Wandering Monk' },
    text: {
      zh: '老僧一夜之宿，求宿。',
      en: 'An old monk seeks shelter for the night.',
    },
    choices: [
      {
        label: { zh: '迎入', en: 'Welcome him' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '夜,僧禅，講解。心,清明。', en: 'In the night, the monk speaks of Zen. Your heart is at peace.' },
      },
      {
        label: { zh: '追払', en: 'Turn him away' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '僧黙去。', en: 'The monk leaves in silence.' },
      },
    ],
  },

  // ─── Phase 34 expansion ─────────────────────────────────────
  {
    id: 'dlg-eunuch-favor',
    speaker: { zh: '宦官', en: 'Court Eunuch' },
    text: {
      zh: '宦官動前來,賄賂換取某官位之推薦，暗中提議。',
      en: 'A eunuch quietly offers to recommend a promotion in exchange for a bribe.',
    },
    choices: [
      { label: { zh: '断固拒否', en: 'Refuse outright' },   effects: [{ kind: 'none' }],
        outcome: { zh: '宦官,顔色，失色而去。良心得保。', en: 'The eunuch leaves, displeased. But your conscience is clean.' } },
      { label: { zh: '受入', en: 'Accept' },           effects: [{ kind: 'gold', delta: -300 }],
        outcome: { zh: '官位，得,評判蒙塵。', en: 'You gained the position — but your reputation is shadowed.' } },
    ],
  },
  {
    id: 'dlg-prophet',
    speaker: { zh: '街頭童謠', en: 'Street Children' },
    text: {
      zh: '街頭童謠:「東風起時,赤雲便起」。 或為不祥之兆？',
      en: 'A street rhyme: "When the east wind blows, red clouds rise." A prophecy?',
    },
    choices: [
      { label: { zh: '禁', en: 'Ban the rhyme' },   effects: [{ kind: 'none' }],
        outcome: { zh: '童們改唱別歌，歌始。', en: 'The children find a new tune.' } },
      { label: { zh: '聞流', en: 'Ignore it' }, effects: [{ kind: 'none' }],
        outcome: { zh: '童謡廣傳,民之不安愈深。', en: 'The rhyme spreads. Unease grows in the streets.' } },
    ],
  },
  {
    id: 'dlg-falling-star',
    speaker: { zh: '天文官', en: 'Astronomer' },
    text: {
      zh: '昨夜,西方大星墜了。古曰,「将星墜」。',
      en: 'A great star fell in the west last night. The ancients say: "a general\'s star falls."',
    },
    choices: [
      { label: { zh: '緘口令', en: 'Suppress the news' }, effects: [{ kind: 'none' }],
        outcome: { zh: '士気保。', en: 'Morale stays intact.' } },
      { label: { zh: '占，', en: 'Divine its meaning' }, effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '占者「敵将凶」告。', en: 'The diviner: "an ill omen — for the enemy."' } },
    ],
  },
  {
    id: 'dlg-stray-dog',
    speaker: { zh: '老農', en: 'Old Farmer' },
    text: {
      zh: '宮殿之門虎之大犬現身了。 主君,?',
      en: 'A great tiger-like dog appeared at the palace gate. My lord, what could it mean?',
    },
    choices: [
      { label: { zh: '飼', en: 'Keep it' },   effects: [{ kind: 'gold', delta: -30 }],
        outcome: { zh: '犬,殿中従。庶民,主公之徳，称。', en: 'The dog follows you in. People praise your virtue.' } },
      { label: { zh: '追払', en: 'Drive it away' }, effects: [{ kind: 'none' }],
        outcome: { zh: '犬,森消。', en: 'The dog vanishes into the forest.' } },
    ],
  },
  {
    id: 'dlg-traveling-doctor',
    speaker: { zh: '游医', en: 'Wandering Physician' },
    text: {
      zh: '医者,珍薬草，兜售。 兵之傷，癒申。',
      en: 'A physician offers rare herbs that he claims will heal soldiers\' wounds.',
    },
    choices: [
      { label: { zh: '購入', en: 'Buy' },          effects: [{ kind: 'gold', delta: -200 }],
        outcome: { zh: '今後,兵之回復早。', en: 'Soldiers heal faster in the coming seasons.' } },
      { label: { zh: '疑', en: 'Suspicious — refuse' }, effects: [{ kind: 'none' }],
        outcome: { zh: '医者,失望去。', en: 'The physician departs disappointed.' } },
    ],
  },
  {
    id: 'dlg-frontier-tribe',
    speaker: { zh: '辺境之使者', en: 'Frontier Envoy' },
    text: {
      zh: '辺境之異民族之首長,贡物換取通商，求前來。',
      en: 'A tribal chieftain from the frontier offers tribute in exchange for trade rights.',
    },
    choices: [
      { label: { zh: '許可', en: 'Grant trade' }, effects: [{ kind: 'gold', delta: 200 }],
        outcome: { zh: '貢物毛皮，得。', en: 'You receive tribute and furs.' } },
      { label: { zh: '拒否', en: 'Refuse' },     effects: [{ kind: 'none' }],
        outcome: { zh: '使者,憤去。', en: 'The envoy departs in anger.' } },
    ],
  },
  {
    id: 'dlg-spy-rumor',
    speaker: { zh: '錦衣衛', en: 'Captain of the Guard' },
    text: {
      zh: '宮殿内密偵潜伏中之傳言。 捜査，命？',
      en: 'Rumor says a spy lurks within the palace. Order an investigation?',
    },
    choices: [
      { label: { zh: '徹底捜査', en: 'Full investigation' }, effects: [{ kind: 'gold', delta: -150 }],
        outcome: { zh: '密偵，捕。 機密守。', en: 'The spy is caught. Secrets remain ours.' } },
      { label: { zh: '無視', en: 'Dismiss the rumor' }, effects: [{ kind: 'none' }],
        outcome: { zh: '平安無事…或許。', en: 'Nothing happens. Probably.' } },
    ],
  },
  {
    id: 'dlg-festival',
    speaker: { zh: '礼部官', en: 'Minister of Rites' },
    text: {
      zh: '春節近。 民祭礼之費用，懇請。',
      en: 'The Spring Festival approaches. The people petition for festival funding.',
    },
    choices: [
      { label: { zh: '盛大祝', en: 'Lavish festival' }, effects: [{ kind: 'gold', delta: -500 }],
        outcome: { zh: '民欣喜,君主，讃。', en: 'The people rejoice and praise their lord.' } },
      { label: { zh: '質素', en: 'A simple celebration' }, effects: [{ kind: 'gold', delta: -100 }],
        outcome: { zh: '民感激。', en: 'The people are content.' } },
      { label: { zh: '見送', en: 'Skip it' }, effects: [{ kind: 'none' }],
        outcome: { zh: '不満之声漏。', en: 'Murmurs of discontent.' } },
    ],
  },
  {
    id: 'dlg-tax-collector',
    speaker: { zh: '徴税官', en: 'Tax Collector' },
    text: {
      zh: '徴税官:「今年不作。 減免，考慮？」',
      en: 'Tax collector: "The harvest was poor. Consider a tax reduction?"',
    },
    choices: [
      { label: { zh: '減税', en: 'Reduce taxes' },     effects: [{ kind: 'gold', delta: -200 }],
        outcome: { zh: '民之忠誠深。', en: 'The people\'s loyalty deepens.' } },
      { label: { zh: '取立', en: 'Collect in full' }, effects: [{ kind: 'gold', delta: 200 }],
        outcome: { zh: '金庫潤,民之心離。', en: 'The treasury swells, but the people grow cold.' } },
    ],
  },
  {
    id: 'dlg-locust-swarm',
    speaker: { zh: '農吏', en: 'Field Officer' },
    text: {
      zh: '南方蝗害之報。 至急,対策，要。',
      en: 'A locust plague hits the southern fields. Urgent action needed.',
    },
    choices: [
      { label: { zh: '兵，派遣', en: 'Send troops to control it' }, effects: [{ kind: 'gold', delta: -250 }],
        outcome: { zh: '蝗害,沈静化。', en: 'The plague is contained.' } },
      { label: { zh: '放任', en: 'Do nothing' }, effects: [{ kind: 'none' }],
        outcome: { zh: '田畑荒。', en: 'Fields lie ruined.' } },
    ],
  },
  {
    id: 'dlg-foreign-scholar',
    speaker: { zh: '異国之学者', en: 'Foreign Scholar' },
    text: {
      zh: '西域来学者,君主之宮廷職，求宿。',
      en: 'A scholar from the Western Regions seeks employment at your court.',
    },
    choices: [
      { label: { zh: '採用', en: 'Hire him' },         effects: [{ kind: 'gold', delta: -150 }],
        outcome: { zh: '宮廷之知識増。', en: 'Your court grows in learning.' } },
      { label: { zh: '断', en: 'Decline' },         effects: [{ kind: 'none' }],
        outcome: { zh: '学者別所，求去。', en: 'The scholar seeks elsewhere.' } },
    ],
  },
  {
    id: 'dlg-dragon-sighting',
    speaker: { zh: '漁師', en: 'Fisherman' },
    text: {
      zh: '川辺之漁師們,「黄龍，見」興奮不已。',
      en: 'Fishermen claim they saw a "yellow dragon" in the river.',
    },
    choices: [
      { label: { zh: '吉兆宣告', en: 'Proclaim a good omen' }, effects: [{ kind: 'none' }],
        outcome: { zh: '民,主公之徳結喜。', en: 'The people link it to your virtue and rejoice.' } },
      { label: { zh: '迷信一蹴', en: 'Dismiss as superstition' }, effects: [{ kind: 'none' }],
        outcome: { zh: '老臣們少失望。', en: 'Old courtiers seem disappointed.' } },
    ],
  },
  {
    id: 'dlg-runaway-prince',
    speaker: { zh: '巷之話題', en: 'Local Gossip' },
    text: {
      zh: '隣国之若君出奔,我領内紛込噂。',
      en: 'A rumor: a young prince from a neighboring realm has fled and is hiding in your domain.',
    },
    choices: [
      { label: { zh: '捜索保護', en: 'Search and shelter him' }, effects: [{ kind: 'gold', delta: -200 }],
        outcome: { zh: '若君，見,人質。', en: 'You find him — and now hold a hostage.' } },
      { label: { zh: '關涉不', en: 'Stay out of it' }, effects: [{ kind: 'none' }],
        outcome: { zh: '何事。', en: 'Nothing comes of it.' } },
    ],
  },
  {
    id: 'dlg-old-soldier',
    speaker: { zh: '老兵', en: 'Old Soldier' },
    text: {
      zh: '老兵宮殿之門現身,「最後之出陣，願」申出。',
      en: 'An old veteran arrives at the palace gates, asking for one last campaign.',
    },
    choices: [
      { label: { zh: '叶', en: 'Grant his request' }, effects: [{ kind: 'none' }],
        outcome: { zh: '老兵涙感謝。', en: 'The veteran weeps in gratitude.' } },
      { label: { zh: '年金，与', en: 'Pension him off' }, effects: [{ kind: 'gold', delta: -100 }],
        outcome: { zh: '老兵,静故郷。', en: 'The veteran returns home, at peace.' } },
    ],
  },
  {
    id: 'dlg-merchant-caravan',
    speaker: { zh: '商隊長', en: 'Caravan Master' },
    text: {
      zh: '商隊領内，通過。 通行税，課？',
      en: 'A merchant caravan passes through your lands. Levy a toll?',
    },
    choices: [
      { label: { zh: '課税', en: 'Tax them' },         effects: [{ kind: 'gold', delta: 150 }],
        outcome: { zh: '商人,渋々払。', en: 'The merchants pay grudgingly.' } },
      { label: { zh: '免除', en: 'Let them pass free' }, effects: [{ kind: 'none' }],
        outcome: { zh: '商人,君主之名，称去。', en: 'The merchants praise your name as they leave.' } },
    ],
  },
  {
    id: 'dlg-comet-second',
    speaker: { zh: '天文官', en: 'Court Astronomer' },
    text: {
      zh: '異星三夜連続現身了。 周易曰,「変動之兆」。',
      en: 'A strange star has appeared three nights running. The Book of Changes warns of upheaval.',
    },
    choices: [
      { label: { zh: '祭祀，行', en: 'Conduct a ritual' }, effects: [{ kind: 'gold', delta: -150 }],
        outcome: { zh: '士気安定。', en: 'Morale steadies.' } },
      { label: { zh: '按兵不動', en: 'Do nothing' }, effects: [{ kind: 'none' }],
        outcome: { zh: '人々不安過。', en: 'People pass anxious days.' } },
    ],
  },
  {
    id: 'dlg-bridge-collapse',
    speaker: { zh: '使者', en: 'Messenger' },
    text: {
      zh: '辺境之橋嵐崩落了。 修復費用二百金。',
      en: 'A frontier bridge has collapsed in the storm. Repairs cost 200 gold.',
    },
    choices: [
      { label: { zh: '修復', en: 'Repair' },          effects: [{ kind: 'gold', delta: -200 }],
        outcome: { zh: '輸送網回復。', en: 'Supply routes restored.' } },
      { label: { zh: '放置', en: 'Leave it' },         effects: [{ kind: 'none' }],
        outcome: { zh: '輸送滞,辺境之不満愈深。', en: 'Trade slows and discontent rises in the borderlands.' } },
    ],
  },
  {
    id: 'dlg-philosopher-debate',
    speaker: { zh: '儒者', en: 'Confucian Scholar' },
    text: {
      zh: '儒者道士宮廷之前論争。 偏袒？',
      en: 'A Confucian and a Daoist argue at your court gate. Take a side?',
    },
    choices: [
      { label: { zh: '儒者，支持', en: 'Side with the Confucian' }, effects: [{ kind: 'none' }],
        outcome: { zh: '儒者之支持，得。', en: 'You gain Confucian support.' } },
      { label: { zh: '道士，支持', en: 'Side with the Daoist' }, effects: [{ kind: 'none' }],
        outcome: { zh: '道家之僧侶之支持，得。', en: 'You gain Daoist support.' } },
      { label: { zh: '中立', en: 'Stay neutral' }, effects: [{ kind: 'none' }],
        outcome: { zh: '両者,不満。', en: 'Both sides leave a little disappointed.' } },
    ],
  },
  {
    id: 'dlg-old-noble-petition',
    speaker: { zh: '長老', en: 'Senior Noble' },
    text: {
      zh: '高齢之重臣引退，懇請。 後任弟子，推薦。',
      en: 'An aged minister asks to retire and recommends his protégé.',
    },
    choices: [
      { label: { zh: '弟子，任命', en: 'Appoint the protégé' }, effects: [{ kind: 'none' }],
        outcome: { zh: '世代交代,円滑進。', en: 'A smooth transition.' } },
      { label: { zh: '辞退，不准', en: 'Refuse the retirement' }, effects: [{ kind: 'none' }],
        outcome: { zh: '老臣,数年仕。', en: 'The old minister serves a few more years.' } },
    ],
  },
  {
    id: 'dlg-foreign-tribute',
    speaker: { zh: '外国使節', en: 'Foreign Envoy' },
    text: {
      zh: '遠国使節,珍奇物産，貢物作為持参了。',
      en: 'An envoy from a distant land arrives with rare goods as tribute.',
    },
    choices: [
      { label: { zh: '厚遇', en: 'Welcome him warmly' }, effects: [{ kind: 'gold', delta: -100 }],
        outcome: { zh: '友好關係築。 名声広。', en: 'A friendship begins. Your fame spreads.' } },
      { label: { zh: '簡素', en: 'Receive him plainly' }, effects: [{ kind: 'none' }],
        outcome: { zh: '使節失望去。', en: 'The envoy leaves disappointed.' } },
    ],
  },
  {
    id: 'dlg-natural-spring',
    speaker: { zh: '農夫', en: 'Farmer' },
    text: {
      zh: '村人:「丘之上霊水湧出了!」 神秘的兆。',
      en: 'Villagers: "A miraculous spring has burst forth on the hill!" A strange omen.',
    },
    choices: [
      { label: { zh: '祠，建', en: 'Build a shrine' }, effects: [{ kind: 'gold', delta: -100 }],
        outcome: { zh: '聖地作為知,巡礼集。', en: 'It becomes a holy site. Pilgrims gather.' } },
      { label: { zh: '一介之泉', en: 'Treat it as ordinary' }, effects: [{ kind: 'none' }],
        outcome: { zh: '村人静崇。', en: 'The villagers quietly venerate it.' } },
    ],
  },

  // ─── Phase 36 — Branching chains ────────────────────────────
  // A choice can set a flag, queue a follow-up dialogue id, or both.
  // The follow-up is fired deterministically the next season.

  // Chain 1: a defector's offer → consequences a season later.
  {
    id: 'dlg-defector-approach',
    speaker: { zh: '密使', en: 'Secret Envoy' },
    text: {
      zh: '敵軍之一将,身一内通，前來。「私，信」。',
      en: 'An enemy general has secretly offered to defect. "Trust me," he pleads.',
    },
    choices: [
      {
        label: { zh: '受入', en: 'Accept his service' },
        effects: [{ kind: 'gold', delta: -200 }, { kind: 'set-flag', flag: 'accepted-defector' }],
        outcome: { zh: '彼，取立。後之展開彼次第。', en: 'You take him in. The next season will tell what kind of man he is.' },
        followupEventId: 'dlg-defector-followup',
      },
      {
        label: { zh: '斬', en: 'Behead him' },
        effects: [{ kind: 'set-flag', flag: 'rejected-defector' }],
        outcome: { zh: '裏切者信。彼之首，晒。', en: 'You trust no turncoat. His head is displayed at the gate.' },
      },
      {
        label: { zh: '送返', en: 'Send him back' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '彼，送返。事終。', en: 'You send him home unharmed. The matter ends here.' },
      },
    ],
  },
  {
    id: 'dlg-defector-followup',
    speaker: { zh: '哨兵', en: 'Sentry' },
    text: {
      zh: '先之降将,夜陰乗陣中之地図，盗逃中，捕了!',
      en: 'The defector from last season — we caught him trying to slip out at night with our camp maps!',
    },
    choices: [
      {
        label: { zh: '処刑見', en: 'Execute as warning' },
        effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '裏切者晒首。臣下之忠誠一段固。', en: 'The traitor is executed publicly. Your retainers stand a little straighter.' },
      },
      {
        label: { zh: '逆偽情報，渡放', en: 'Feed him false intel and release him' },
        effects: [{ kind: 'none' }, { kind: 'set-flag', flag: 'fed-false-intel' }],
        outcome: { zh: '偽之進軍計画，持逃。敵将,毒餌食。', en: 'You let him "escape" with forged battle plans. Time will tell if the enemy bites.' },
      },
    ],
    conditions: { requiresFlag: 'accepted-defector' },
  },

  // Chain 2: a holy mountain hermit → his disciple returns later if you were generous.
  {
    id: 'dlg-hermit-visit',
    speaker: { zh: '老隠者', en: 'Old Hermit' },
    text: {
      zh: '深山下老人,治国之道，説来。「,君之道何処」',
      en: 'An old hermit descends from the mountains to lecture on the Way. "Tell me — where lies your path?"',
    },
    choices: [
      {
        label: { zh: '丁重迎', en: 'Welcome him with full honors' },
        effects: [{ kind: 'gold', delta: -80 }, { kind: 'set-flag', flag: 'honored-hermit' }],
        outcome: { zh: '老人,数日語合満足去。', en: 'The hermit converses for days, then departs satisfied.' },
        followupEventId: 'dlg-hermit-disciple',
      },
      {
        label: { zh: '寒食，出', en: 'Offer him only cold rations' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '老人,黙去。', en: 'The hermit departs without a word.' },
      },
      {
        label: { zh: '追払', en: 'Drive him off' },
        effects: [{ kind: 'set-flag', flag: 'scorned-hermit' }],
        outcome: { zh: '老人,呪言，残去。', en: 'The hermit leaves muttering curses.' },
      },
    ],
  },
  {
    id: 'dlg-hermit-disciple',
    speaker: { zh: '若弟子', en: 'Young Disciple' },
    text: {
      zh: '先之隠者之弟子申者,「師之遺言」参上。眼光鋭,才気明。',
      en: 'A young man arrives saying he is the late hermit\'s disciple. His eyes are sharp; talent is plain.',
    },
    choices: [
      {
        label: { zh: '臣作為召抱', en: 'Take him as a retainer' },
        effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '若才,君之幕下加。', en: 'A new talent joins your camp.' },
      },
      {
        label: { zh: '路銀，渡送', en: 'Give him travel money and send him on' },
        effects: [{ kind: 'gold', delta: -20 }],
        outcome: { zh: '彼,別之主君，求旅立。', en: 'He goes to seek service elsewhere.' },
      },
    ],
    conditions: { requiresFlag: 'honored-hermit' },
  },

  // Chain 3: famine relief → townspeople remember.
  {
    id: 'dlg-famine-village',
    speaker: { zh: '村長', en: 'Village Elder' },
    text: {
      zh: '凶作村人餓。御救，。',
      en: 'A village suffers a poor harvest. The elder begs for relief grain.',
    },
    choices: [
      {
        label: { zh: '蔵，開救', en: 'Open the granaries' },
        effects: [{ kind: 'gold', delta: -150 }, { kind: 'set-flag', flag: 'opened-granaries' }],
        outcome: { zh: '村,救済，受,君之徳，讃。', en: 'The village survives. Your name is praised everywhere.' },
        followupEventId: 'dlg-grateful-villagers',
      },
      {
        label: { zh: '半額之', en: 'Send half what they ask' },
        effects: [{ kind: 'gold', delta: -75 }],
        outcome: { zh: '不十分,村耐忍。', en: 'Not enough, but they survive — barely.' },
      },
      {
        label: { zh: '断', en: 'Refuse' },
        effects: [{ kind: 'set-flag', flag: 'refused-relief' }],
        outcome: { zh: '村人,君，恨。', en: 'The village curses your name.' },
      },
    ],
  },
  {
    id: 'dlg-grateful-villagers',
    speaker: { zh: '村之若者', en: 'Village Youth' },
    text: {
      zh: '前之救済之御恩,忘。我一同,兵志願参上了。',
      en: 'We have not forgotten the grain you sent. The young men of our village wish to enlist!',
    },
    choices: [
      {
        label: { zh: '喜迎', en: 'Welcome them' },
        effects: [{ kind: 'gold', delta: -30 }],
        outcome: { zh: '志願兵陣加。', en: 'Volunteers swell your ranks.' },
      },
      {
        label: { zh: '農戻', en: 'Send them back to the fields' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '農国之本論。', en: 'You remind them that farming is the root of the state.' },
      },
    ],
    conditions: { requiresFlag: 'opened-granaries' },
  },

  // ─── 天時地利 — omens, weather, calamity ───────────────────────────
  {
    id: 'dlg-drought-prayer',
    speaker: { zh: '農正', en: 'Master of Husbandry' },
    text: {
      zh: '亢旱經旬,禾苗盡枯。府庫尚有餘糧,然民已嗷嗷。',
      en: 'A long drought has withered the crops. The granaries still hold something, but the people are already crying out.',
    },
    choices: [
      {
        label: { zh: '開倉賑濟', en: 'Open the granaries' },
        effects: [{ kind: 'gold', delta: -120 }],
        outcome: { zh: '糧出而民安,皆頌君之仁。', en: 'Grain flows out, the people settle. They praise your benevolence.' },
      },
      {
        label: { zh: '設壇祈雨', en: 'Build an altar and pray for rain' },
        effects: [{ kind: 'gold', delta: -40 }],
        outcome: { zh: '築壇祭天,數日後果得甘霖。', en: 'You raise an altar — and days later, the sweet rain comes.' },
      },
      {
        label: { zh: '聽天由命', en: 'Leave it to Heaven' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '官府不動,鄉里怨聲漸起。', en: 'The offices stay shut. Resentment stirs in the villages.' },
      },
    ],
  },
  {
    id: 'dlg-locust-swarm',
    speaker: { zh: '驛使', en: 'Post Rider' },
    text: {
      zh: '蝗自東來,蔽日如雲,所過田畝立成赤地。',
      en: 'Locusts came out of the east, a cloud that blotted the sun. Where they pass, the fields turn to bare earth.',
    },
    choices: [
      {
        label: { zh: '懸賞募民捕蝗', en: 'Pay a bounty for every catch' },
        effects: [{ kind: 'gold', delta: -90 }],
        outcome: { zh: '萬人出動,焚瘞無算,蝗勢遂衰。', en: 'Thousands turn out; the swarm is beaten back basketful by basketful.' },
      },
      {
        label: { zh: '焚田絕其食', en: 'Burn the worst fields to starve them' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '忍痛焚田,蝗無所食而散,然秋收已損。', en: 'You burn to deny them food. The swarm scatters — but the harvest is already gutted.' },
      },
    ],
  },
  {
    id: 'dlg-white-deer',
    speaker: { zh: '獵戶', en: 'Huntsman' },
    text: {
      zh: '山中得一白鹿,通體如雪,古以為瑞。獻於君前。',
      en: 'In the hills we took a white deer, snow-pale from hoof to horn — the ancients called such a beast an omen. We bring it before you.',
    },
    choices: [
      {
        label: { zh: '宣告祥瑞', en: 'Proclaim it auspicious' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '榜告四方,民以為新世將至,人心稍振。', en: 'Word goes out; the people take heart that a new age dawns.' },
      },
      {
        label: { zh: '縱之歸山', en: 'Set it free' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '君曰:「瑞在德不在獸。」放之,士論稱善。', en: '"The omen is in virtue, not in beasts," you say, and release it. The scholars approve.' },
      },
      {
        label: { zh: '厚賞獵戶', en: 'Reward the huntsman richly' },
        effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '賞金五十,獵戶感泣,鄉里傳君之慷慨。', en: 'Fifty in gold; the huntsman weeps. Your generosity is the talk of the district.' },
      },
    ],
  },
  {
    id: 'dlg-street-rhyme',
    speaker: { zh: '校事', en: 'Intelligence Officer' },
    text: {
      zh: '市井童謠忽起,辭多隱語,似指府中將有變故。',
      en: 'A children\'s rhyme has sprung up in the markets — full of riddles that seem to hint at upheaval in your court.',
    },
    choices: [
      {
        label: { zh: '暗中查訪', en: 'Investigate quietly' },
        effects: [{ kind: 'gold', delta: -30 }],
        outcome: { zh: '查得乃他鎮細作所散,謠言遂止。', en: 'Agents trace it to a rival\'s spies. The whispers fade.' },
      },
      {
        label: { zh: '一笑置之', en: 'Laugh it off' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '君曰:「童謠豈足懼?」數日後果自息。', en: '"What ruler fears a nursery rhyme?" In days it dies on its own.' },
      },
    ],
  },

  // ─── 市井人情 — petitions, merchants, folk ─────────────────────────
  {
    id: 'dlg-refugee-column',
    speaker: { zh: '城門吏', en: 'Gate Warden' },
    text: {
      zh: '城外流民數千,扶老攜幼,皆避兵亂而來,跪請收容。',
      en: 'Thousands of refugees crowd the gate — old and young, fleeing the wars — kneeling to beg shelter.',
    },
    choices: [
      {
        label: { zh: '開城安置,授田屯墾', en: 'Admit them; give them land to till' },
        effects: [{ kind: 'gold', delta: -100 }],
        outcome: { zh: '流民得安,墾荒成田,數年後反為富庶。', en: 'Settled and given fields, in a few years they make the marches rich.' },
      },
      {
        label: { zh: '揀壯者充軍', en: 'Take the able-bodied as soldiers' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '壯者入伍,老弱自去,軍中略增,然有議其不仁。', en: 'The strong are enrolled; the rest drift on. Your ranks grow — and some call it heartless.' },
      },
      {
        label: { zh: '閉門謝之', en: 'Bar the gate' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '流民他往,然「閉門拒流民」之語,終傳天下。', en: 'They move on — but the tale of the barred gate travels with them.' },
      },
    ],
  },
  {
    id: 'dlg-foreign-tribute',
    speaker: { zh: '譯官', en: 'Interpreter' },
    text: {
      zh: '遠方部族遣使來貢,獻良馬與皮貨,願通互市。',
      en: 'Envoys of a distant tribe arrive bearing fine horses and furs, seeking to open trade.',
    },
    choices: [
      {
        label: { zh: '厚禮回贈,結其歡心', en: 'Return rich gifts to win their favour' },
        effects: [{ kind: 'gold', delta: -60 }],
        outcome: { zh: '禮尚往來,自此邊市不絕,良馬歲至。', en: 'Gifts pass both ways; the border market thrives, and good horses come yearly.' },
      },
      {
        label: { zh: '受貢而薄報', en: 'Accept the tribute, give little back' },
        effects: [{ kind: 'gold', delta: 80 }],
        outcome: { zh: '府庫得實,然使者怏怏而歸。', en: 'The treasury gains — but the envoys leave sullen.' },
      },
    ],
  },
  {
    id: 'dlg-curio-merchant',
    speaker: { zh: '行商', en: 'Travelling Merchant' },
    text: {
      zh: '西域奇珍一函,商賈言乃前朝舊物,索價不菲。',
      en: 'A merchant offers a casket of curios from the west — relics of a fallen age, he claims, and not cheap.',
    },
    choices: [
      {
        label: { zh: '購之藏於府庫', en: 'Buy it for the treasury' },
        effects: [{ kind: 'gold', delta: -70 }],
        outcome: { zh: '所購果為真品,後值連城。', en: 'It proves genuine — worth a city in years to come.' },
      },
      {
        label: { zh: '討價還價', en: 'Haggle hard' },
        effects: [{ kind: 'gold', delta: -30 }],
        outcome: { zh: '幾番折衝,半價而得,商賈苦笑。', en: 'After much wrangling you take it at half price; the merchant smiles thinly.' },
      },
      {
        label: { zh: '婉拒', en: 'Decline politely' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '君曰:「玩物喪志。」商賈悻悻去。', en: '"Such trifles sap a ruler\'s will," you say. He shuffles off, disappointed.' },
      },
    ],
  },
  {
    id: 'dlg-old-veteran',
    speaker: { zh: '老卒', en: 'Old Soldier' },
    text: {
      zh: '一老卒拄杖求見,言隨先主征戰半生,今老病無依,乞一活路。',
      en: 'An old soldier hobbles in on a cane — half a life spent in your campaigns, now sick and destitute, begging a way to live.',
    },
    choices: [
      {
        label: { zh: '賜田養老', en: 'Grant him a pension and land' },
        effects: [{ kind: 'gold', delta: -40 }],
        outcome: { zh: '老卒泣謝,軍中聞之,皆感君不忘舊。', en: 'He weeps his thanks. The army hears, and loves you for not forgetting the old guard.' },
      },
      {
        label: { zh: '署為教頭', en: 'Make him a drill instructor' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '老卒授新兵以實戰之法,軍習為之一精。', en: 'He teaches the recruits the hard lessons of real war; the drilling sharpens.' },
      },
    ],
  },

  // ─── 朝堂風議 — court, scholars, discipline ────────────────────────
  {
    id: 'dlg-remonstrance',
    speaker: { zh: '直臣', en: 'Outspoken Official' },
    text: {
      zh: '一臣當廷直諫,歷數近政之失,辭頗激切,左右為之色變。',
      en: 'An official rebukes your recent rule to your face, listing its failings — so bluntly the court goes pale.',
    },
    choices: [
      {
        label: { zh: '虛心納諫', en: 'Hear him out and amend' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '君改其過,賢者聞之,多有來投。', en: 'You mend what he named. Hearing it, worthies come to your banner.' },
      },
      {
        label: { zh: '賞其敢言', en: 'Reward his courage' },
        effects: [{ kind: 'gold', delta: -30 }],
        outcome: { zh: '賜帛旌直,自此朝中敢言者眾。', en: 'You reward the candour with silk. Now the court dares to speak.' },
      },
      {
        label: { zh: '斥退之', en: 'Dismiss him from your sight' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '直臣拂袖去,自此進諫者寡。', en: 'He storms out. After that, few bring you hard truths.' },
      },
    ],
  },
  {
    id: 'dlg-wandering-monk',
    speaker: { zh: '雲遊僧', en: 'Wandering Monk' },
    text: {
      zh: '一僧持缽至,言能觀氣數,願為君卜一卦,只乞些許香火。',
      en: 'A monk arrives with his alms-bowl, claiming to read the tides of fortune — asking only a little for incense in return for a reading.',
    },
    choices: [
      {
        label: { zh: '施以香火', en: 'Give alms and hear him' },
        effects: [{ kind: 'gold', delta: -20 }],
        outcome: { zh: '僧言「積善之家必有餘慶」,飄然而去。', en: '"A house that hoards good deeds reaps surplus joy," he says, and drifts away.' },
      },
      {
        label: { zh: '與之論道', en: 'Debate doctrine with him' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '君與僧辯難半日,左右歎服。', en: 'You spar over scripture half a day; the court is impressed.' },
      },
      {
        label: { zh: '遣之', en: 'Send him on his way' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '君曰:「氣數在人不在卦。」僧頷首去。', en: '"Fortune is made by men, not foretold," you say. He nods and goes.' },
      },
    ],
  },
  {
    id: 'dlg-gambling-soldiers',
    speaker: { zh: '軍法官', en: 'Provost' },
    text: {
      zh: '營中私設賭坊,士卒擲骰至深夜,屢禁不止。',
      en: 'The men have set up a gambling den in camp, throwing dice past midnight. Bans have not stopped it.',
    },
    choices: [
      {
        label: { zh: '抽其賭資入庫', en: 'Tax the table for the treasury' },
        effects: [{ kind: 'gold', delta: 50 }],
        outcome: { zh: '官抽一成,賭風雖在,府庫小盈。', en: 'A tithe off every pot — the dice still roll, but the coffers gain.' },
      },
      {
        label: { zh: '嚴禁重罰', en: 'Ban it and flog the ringleaders' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '杖其首者,賭坊遂散,軍紀肅然。', en: 'The ringleaders are caned; the den breaks up; discipline tightens.' },
      },
    ],
  },
  {
    id: 'dlg-master-smith',
    speaker: { zh: '鑄劍師', en: 'Master Smith' },
    text: {
      zh: '一鑄劍名匠來投,言能鍛百煉之鋼,願為君造利兵,然非重金不可。',
      en: 'A famed swordsmith presents himself — he can forge hundred-fold steel, he says, and arm your guard, but only for serious gold.',
    },
    choices: [
      {
        label: { zh: '出資命其開爐', en: 'Fund his forge' },
        effects: [{ kind: 'gold', delta: -80 }],
        outcome: { zh: '匠人開爐三月,所出之刃削鐵如泥。', en: 'Three months at the furnace, and his blades cut iron like clay.' },
      },
      {
        label: { zh: '先試其技', en: 'Test his skill first' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '命鑄一劍以驗,果非凡品,乃留之。', en: 'You bid him forge one to prove it. It is no common steel — you keep him on.' },
      },
      {
        label: { zh: '辭之', en: 'Turn him away' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '匠人嘆「明珠暗投」,負槌而去。', en: '"A pearl cast into the dark," he sighs, and shoulders his hammer away.' },
      },
    ],
  },
  {
    id: 'dlg-tomb-unearthed',
    speaker: { zh: '屯田吏', en: 'Field Overseer' },
    text: {
      zh: '屯墾掘地,得一古塚,中有金玉禮器,似前朝王侯之葬。',
      en: 'Breaking new ground for farms, the labourers struck an ancient tomb — gold and jade ritual vessels within, a lord of some fallen age.',
    },
    choices: [
      {
        label: { zh: '取器入庫', en: 'Take the treasures for the state' },
        effects: [{ kind: 'gold', delta: 100 }],
        outcome: { zh: '器入府庫,然鄉老竊議掘墓不祥。', en: 'The vessels enter the treasury — though the village elders mutter that grave-robbing brings ill luck.' },
      },
      {
        label: { zh: '封塚改屯他處', en: 'Reseal the tomb and farm elsewhere' },
        effects: [{ kind: 'gold', delta: -30 }],
        outcome: { zh: '君命厚封之,徙屯別所,士民稱其有禮。', en: 'You order it sealed with honour and move the farms. The people call you a man of rites.' },
      },
    ],
  },
  {
    id: 'dlg-festival-petition',
    speaker: { zh: '里正', en: 'Village Elder' },
    text: {
      zh: '父老聯名,請於秋收後辦一社祭,以酬神而樂民。',
      en: 'The elders petition together: after the autumn harvest, hold a village festival to thank the gods and gladden the people.',
    },
    choices: [
      {
        label: { zh: '撥款大辦', en: 'Fund a grand festival' },
        effects: [{ kind: 'gold', delta: -70 }],
        outcome: { zh: '社祭三日,民歌載道,皆頌君之德。', en: 'Three days of feasting and song; the roads ring with praise of your rule.' },
      },
      {
        label: { zh: '從簡而行', en: 'Allow a modest one' },
        effects: [{ kind: 'gold', delta: -20 }],
        outcome: { zh: '小祭一日,民亦歡然。', en: 'A single day, simply done — and still the people rejoice.' },
      },
      {
        label: { zh: '以農時為重,止之', en: 'Forbid it — the fields come first' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '父老怏怏而退,然農事不廢。', en: 'The elders withdraw, downcast — but no work-day is lost.' },
      },
    ],
  },
  {
    id: 'dlg-traveling-physician',
    speaker: { zh: '遊方醫', en: 'Itinerant Physician' },
    text: {
      zh: '一遊方醫求見,言精岐黃之術,願留軍中療傷病,然須備藥資。',
      en: 'A travelling physician seeks audience — versed in the healing arts, he says, and willing to tend your sick and wounded, if you stock his medicines.',
    },
    choices: [
      {
        label: { zh: '留之,供其藥材', en: 'Retain him and supply the herbs' },
        effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '軍中傷病多愈,士卒感其活命之恩。', en: 'The sick and wounded mend; the soldiers bless the man who pulled them back.' },
      },
      {
        label: { zh: '聽其自去', en: 'Let him pass on' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '醫者另投他處,後聞其名動一方。', en: 'He seeks another patron; later you hear his fame has spread far.' },
      },
    ],
  },

  // ── Chain 3: 失竊的稅銀 — robbed convoy → a season later, the trail pays off
  //    (caught a corrupt official) or the cover-up festers (bandits return). ──
  {
    id: 'dlg-tax-silver',
    speaker: { zh: '度支官', en: 'Treasury Clerk' },
    text: {
      zh: '解送府庫之稅銀,中途為人劫去,押運卒言遇蒙面之眾,然語多閃爍。',
      en: 'A convoy of tax silver bound for the treasury was waylaid on the road. The guards speak of masked bandits — but their story keeps slipping.',
    },
    choices: [
      {
        label: { zh: '嚴查到底', en: 'Run the matter to ground' },
        effects: [{ kind: 'gold', delta: -50 }, { kind: 'set-flag', flag: 'tax-silver-probe' }],
        outcome: { zh: '密遣幹吏,順藤摸瓜,且看下季分曉。', en: 'You send sharp men down the trail. Next season will tell where it leads.' },
        followupEventId: 'dlg-tax-silver-caught',
      },
      {
        label: { zh: '息事寧人', en: 'Let it quietly drop' },
        effects: [{ kind: 'set-flag', flag: 'tax-silver-hushed' }],
        outcome: { zh: '案遂不了了之,然其風聲,已入宵小之耳。', en: 'The case is hushed — but word of it has reached the wrong ears.' },
        followupEventId: 'dlg-tax-silver-festers',
      },
      {
        label: { zh: '自認損失', en: 'Write off the loss' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '君曰:「財去人安。」遂不復究。', en: '"Coin lost, peace kept," you say, and pursue it no further.' },
      },
    ],
    conditions: { minYear: 188 },
  },
  {
    id: 'dlg-tax-silver-caught',
    speaker: { zh: '幹吏', en: 'Investigator' },
    text: {
      zh: '查得劫銀者,竟是本郡一縣令,監守自盜,贓銀尚埋於其後園。',
      en: 'The trail closes on a county magistrate of your own — he robbed the silver he was sworn to guard. The loot is still buried in his garden.',
    },
    choices: [
      {
        label: { zh: '抄沒家產', en: 'Confiscate his estate' },
        effects: [{ kind: 'gold', delta: 120 }],
        outcome: { zh: '贓款盡入府庫,並抄其家,小有所獲。', en: 'The silver returns to the treasury, and his estate with it.' },
      },
      {
        label: { zh: '明正典刑', en: 'Execute him by the law' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '梟首示眾,百官凜然,自此無敢貪墨。', en: 'His head goes up at the gate. The officials pale — and the pilfering stops.' },
      },
      {
        label: { zh: '念其舊功,網開一面', en: 'Spare him for past service' },
        effects: [{ kind: 'gold', delta: 40 }],
        outcome: { zh: '令其退贓罷官,寬而不縱,士論稱平。', en: 'You make him return the silver and strip his post — mercy without licence. The verdict is called just.' },
      },
    ],
    conditions: { requiresFlag: 'tax-silver-probe' },
  },
  {
    id: 'dlg-tax-silver-festers',
    speaker: { zh: '亭長', en: 'Village Constable' },
    text: {
      zh: '前番劫銀之事既不究,賊膽益壯,今聚眾據山,反遣人下書,索「過路之資」。',
      en: 'Since the silver theft went unpunished, the bandits have grown bold — now holed up in the hills, they send word demanding a "toll for safe passage."',
    },
    choices: [
      {
        label: { zh: '發兵清剿', en: 'Send troops to root them out' },
        effects: [{ kind: 'gold', delta: -90 }],
        outcome: { zh: '一鼓蕩平,山道復安,然耗錢糧不少。', en: 'You break them in one push; the roads are safe again — at no small cost.' },
      },
      {
        label: { zh: '暫納其貢以安商旅', en: 'Pay them off to keep the roads open' },
        effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '輸金買安,商旅雖通,然養虎之患,終非長策。', en: 'Gold buys quiet and the caravans roll — but a fed tiger is no lasting peace.' },
      },
    ],
    conditions: { requiresFlag: 'tax-silver-hushed' },
  },

  // ── Chain 4: 流亡名士 — a famed scholar in exile passes through; how you
  //    treat him decides whether he stays, or merely speaks well of you. ──
  {
    id: 'dlg-exiled-scholar',
    speaker: { zh: '門吏', en: 'Gate Clerk' },
    text: {
      zh: '一名士避亂過境,海內知其名,然布衣芒鞋,落魄如寒儒。將軍待之如何?',
      en: 'A scholar of realm-wide fame passes through, fleeing the wars — yet he comes in plain cloth and straw sandals, down on his luck. How will you receive him?',
    },
    choices: [
      {
        label: { zh: '築館厚待', en: 'House him in honour' },
        effects: [{ kind: 'gold', delta: -80 }, { kind: 'set-flag', flag: 'scholar-hosted' }],
        outcome: { zh: '築精舍,饋束脩,禮之甚恭。下季觀其去留。', en: 'You build him fine lodging and ply him with gifts. Next season will show if he stays.' },
        followupEventId: 'dlg-exiled-scholar-stays',
      },
      {
        label: { zh: '以禮相送', en: 'See him off with courtesy' },
        effects: [{ kind: 'set-flag', flag: 'scholar-sent-off' }],
        outcome: { zh: '贈以路資,親送出境,不敢慢之。', en: 'You give him travelling money and see him to the border yourself — no slight offered.' },
        followupEventId: 'dlg-exiled-scholar-praised',
      },
      {
        label: { zh: '置之不理', en: 'Pay him no mind' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '一寒士耳,何足掛齒。名士默然而去。', en: '"A penniless scholar — what of it?" He leaves without a word.' },
      },
    ],
    conditions: { minYear: 190 },
  },
  {
    id: 'dlg-exiled-scholar-stays',
    speaker: { zh: '名士', en: 'The Scholar' },
    text: {
      zh: '名士感君厚遇,願留為賓客,且言:「某之同道數人,亦避地在近,可為君致之。」',
      en: 'Moved by your generosity, the scholar agrees to stay as a guest — and adds: "Several of my fellows shelter nearby. I could bring them to you."',
    },
    choices: [
      {
        label: { zh: '廣設講席,招其同道', en: 'Open a hall and gather his circle' },
        effects: [{ kind: 'gold', delta: -60 }],
        outcome: { zh: '名士相引而至,一時談者盈門,文教為之一振。', en: 'His circle follows him in; the halls fill with discourse, and learning flourishes under your roof.' },
      },
      {
        label: { zh: '委以參謀', en: 'Take him as a counsellor' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '名士入幕參謀,所獻多切時要。', en: 'He joins your council, and his counsel cuts to the heart of the hour.' },
      },
    ],
    conditions: { requiresFlag: 'scholar-hosted' },
  },
  {
    id: 'dlg-exiled-scholar-praised',
    speaker: { zh: '使者', en: 'Messenger' },
    text: {
      zh: '前番禮送之名士,所至盛稱君之賢。有一隱者聞之,不遠千里,前來求見。',
      en: 'The scholar you saw off has been praising your character wherever he goes. A recluse, hearing it, has travelled a thousand li to seek you out.',
    },
    choices: [
      {
        label: { zh: '厚幣聘之', en: 'Engage him with rich gifts' },
        effects: [{ kind: 'gold', delta: -70 }],
        outcome: { zh: '厚幣既至,隱者感而留之,賢名益遠。', en: 'The gifts move him; he stays, and your name for worthiness spreads further still.' },
      },
      {
        label: { zh: '虛位以待', en: 'Keep a seat open and let him choose' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '君不強留,隱者歎服其量,自願效力。', en: 'You press him for nothing; impressed by your restraint, he offers his service freely.' },
      },
    ],
    conditions: { requiresFlag: 'scholar-sent-off' },
  },
];

/** Lookup by id for branching follow-ups. */
export const DIALOGUE_EVENTS_BY_ID: Record<string, DialogueEvent> =
  Object.fromEntries(DIALOGUE_EVENTS.map((d) => [d.id, d]));
