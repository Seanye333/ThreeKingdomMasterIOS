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
    speaker: { zh: '傳報小吏', en: 'Court Messenger' },
    text: {
      zh: '席間二將爭言,拍案而起,幾至拔刃相向。',
      en: 'Two of your generals brawled at a banquet — blades were nearly drawn.',
    },
    choices: [
      {
        label: { zh: '兩下並罰', en: 'Punish both' },
        effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '各降一階,軍中肅然。', en: 'Both demoted. Discipline restored.' },
      },
      {
        label: { zh: '置之不問', en: 'Let it pass' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '醉後之爭而已,天明也就忘了。', en: 'Just drunkards quarreling. Forgotten by dawn.' },
      },
      {
        label: { zh: '沒其酒器', en: 'Confiscate the wine' },
        effects: [{ kind: 'gold', delta: 30 }],
        outcome: { zh: '酒具變賣得三十金,入於府庫。', en: 'The wine was sold — 30 gold to the treasury.' },
      },
    ],
  },
  {
    id: 'dlg-omen-comet',
    speaker: { zh: '太史令', en: 'Court Astronomer' },
    text: {
      zh: '彗星見於天際。太史令奏曰:「彗者,除舊布新之象也。」',
      en: 'A comet has appeared. The ancients say: "the broom-star foretells change."',
    },
    choices: [
      {
        label: { zh: '宣為祥瑞', en: 'Proclaim it a good omen' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '民間傳為新朝將興,人人喜形於色。', en: 'The people rejoice — a new age begins!' },
      },
      {
        label: { zh: '置之不理', en: 'Ignore it' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '斥為星官妄言,不復再問。', en: 'Dismissed as the astronomer\'s rambling.' },
      },
    ],
  },
  {
    id: 'dlg-bandit-offer',
    speaker: { zh: '使者', en: 'Messenger' },
    text: {
      zh: '山賊遣人下書:「與我二百金,即日散眾而去。」',
      en: 'A bandit chieftain offers to disperse his forces for 200 gold.',
    },
    choices: [
      {
        label: { zh: '如數與之', en: 'Pay' },
        effects: [{ kind: 'gold', delta: -200 }],
        outcome: { zh: '賊眾果然解散 —— 這一次。', en: 'The bandits disperse — as promised, this time.' },
      },
      {
        label: { zh: '討伐', en: 'Hunt them down' },
        effects: [{ kind: 'troops', cityId: '', delta: -300 }],
        outcome: { zh: '官軍雖有折損,寨巢終於蕩平。', en: 'Casualties taken, but the bandits are gone.' },
      },
      {
        label: { zh: '置之不理', en: 'Ignore' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '今日不問,他日恐為心腹之患。', en: 'May come back to haunt you.' },
      },
    ],
  },
  {
    id: 'dlg-poet-gift',
    speaker: { zh: '老詩人', en: 'Old Poet' },
    text: {
      zh: '有名詩人來謁,願獻新篇於明公。',
      en: 'A renowned poet has come to offer verses to your court.',
    },
    choices: [
      {
        label: { zh: '厚賜黃金', en: 'Reward with gold' },
        effects: [{ kind: 'gold', delta: -100 }],
        outcome: { zh: '詩人大喜。明公之名,將隨其詩傳於後世。', en: 'The poet is delighted. Your name will live in his verses.' },
      },
      {
        label: { zh: '但奉一盞茶', en: 'Just tea' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '詩人默然而退。', en: 'The poet leaves quietly.' },
      },
    ],
  },
  {
    id: 'dlg-rain-pour',
    speaker: { zh: '農吏', en: 'Agriculture Official' },
    text: {
      zh: '今春雨水調勻,田畝滋潤,秋成可望。',
      en: 'This spring has brought generous rains. The harvest will be bountiful.',
    },
    choices: [
      {
        label: { zh: '犒賞農戶', en: 'Reward the farmers' },
        effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '農人感懷,鄉里之心大附。', en: 'Farmer loyalty rises visibly.' },
      },
      {
        label: { zh: '下一紙嘉勉', en: 'Just thanks' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '農人亦知足矣。', en: 'The farmers will be satisfied.' },
      },
    ],
  },
  {
    id: 'dlg-orphan-petition',
    speaker: { zh: '孤兒', en: 'Orphan' },
    text: {
      zh: '兵燹之後,孤兒數十聚於府門,衣不蔽體,望之惻然。',
      en: 'Orphans of war gather at your palace gates — wretched.',
    },
    choices: [
      {
        label: { zh: '設粥廠賑之', en: 'Establish a relief fund' },
        effects: [{ kind: 'gold', delta: -150 }],
        outcome: { zh: '施粥活人,里巷交口稱頌。', en: 'The people sing your praise.' },
      },
      {
        label: { zh: '逐之去', en: 'Have them driven away' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '百姓見之,頗為失望。', en: 'The people are disappointed.' },
      },
    ],
  },
  {
    id: 'dlg-merchant-deal',
    speaker: { zh: '商人', en: 'Travelling Merchant' },
    text: {
      zh: '西域賈人載珍寶而至,願售於明公。',
      en: 'A merchant from the Western Regions offers rare treasures.',
    },
    choices: [
      {
        label: { zh: '購之', en: 'Buy' },
        effects: [{ kind: 'gold', delta: -300 }],
        outcome: { zh: '珍玩入庫,一時光彩。', en: 'The treasures enrich your court.' },
      },
      {
        label: { zh: '謝而不受', en: 'Decline' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '賈人收貨他往。', en: 'The merchant moves on.' },
      },
    ],
  },

  // ─── Phase 34 expansion ─────────────────────────────────────
  {
    id: 'dlg-eunuch-favor',
    speaker: { zh: '宦官', en: 'Court Eunuch' },
    text: {
      zh: '一宦者密來低語:「某官闕位,若肯稍通關節,某當為公薦之。」',
      en: 'A eunuch quietly offers to recommend a promotion in exchange for a bribe.',
    },
    choices: [
      { label: { zh: '峻拒之', en: 'Refuse outright' },   effects: [{ kind: 'none' }],
        outcome: { zh: '宦者變色而去。然此心無愧。', en: 'The eunuch leaves, displeased. But your conscience is clean.' } },
      { label: { zh: '納其請', en: 'Accept' },           effects: [{ kind: 'gold', delta: -300 }],
        outcome: { zh: '官位是得了,清議之中卻多了一句閒話。', en: 'You gained the position — but your reputation is shadowed.' } },
    ],
  },
  {
    id: 'dlg-prophet',
    speaker: { zh: '街頭童謠', en: 'Street Children' },
    text: {
      zh: '市井童謠忽起:「東風動時,赤雲隨之。」語涉不祥。',
      en: 'A street rhyme: "When the east wind blows, red clouds rise." A prophecy?',
    },
    choices: [
      { label: { zh: '禁其傳唱', en: 'Ban the rhyme' },   effects: [{ kind: 'none' }],
        outcome: { zh: '童子改唱他曲,街巷暫靜。', en: 'The children find a new tune.' } },
      { label: { zh: '聽之任之', en: 'Ignore it' }, effects: [{ kind: 'none' }],
        outcome: { zh: '謠言愈傳愈廣,人心益不自安。', en: 'The rhyme spreads. Unease grows in the streets.' } },
    ],
  },
  {
    id: 'dlg-falling-star',
    speaker: { zh: '太史令', en: 'Astronomer' },
    text: {
      zh: '昨夜有大星隕於西方。古語云:「將星墜,主大將亡。」',
      en: 'A great star fell in the west last night. The ancients say: "a general\'s star falls."',
    },
    choices: [
      { label: { zh: '下令勿傳', en: 'Suppress the news' }, effects: [{ kind: 'none' }],
        outcome: { zh: '軍中不聞其事,士氣如故。', en: 'Morale stays intact.' } },
      { label: { zh: '命太史占之', en: 'Divine its meaning' }, effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '占者奏曰:「此凶在敵,不在我。」', en: 'The diviner: "an ill omen — for the enemy."' } },
    ],
  },
  {
    id: 'dlg-stray-dog',
    speaker: { zh: '老農', en: 'Old Farmer' },
    text: {
      zh: '府門外來一巨犬,狀貌如虎,伏而不去。主公,此何兆也?',
      en: 'A great tiger-like dog appeared at the palace gate. My lord, what could it mean?',
    },
    choices: [
      { label: { zh: '留而畜之', en: 'Keep it' },   effects: [{ kind: 'gold', delta: -30 }],
        outcome: { zh: '犬隨入堂中。百姓傳言主公有德,故猛獸來馴。', en: 'The dog follows you in. People praise your virtue.' } },
      { label: { zh: '逐之', en: 'Drive it away' }, effects: [{ kind: 'none' }],
        outcome: { zh: '犬入林間,再不見蹤影。', en: 'The dog vanishes into the forest.' } },
    ],
  },
  {
    id: 'dlg-traveling-doctor',
    speaker: { zh: '遊方醫', en: 'Wandering Physician' },
    text: {
      zh: '一遊方醫求見,出示奇藥,自言可癒金瘡。',
      en: 'A physician offers rare herbs that he claims will heal soldiers\' wounds.',
    },
    choices: [
      { label: { zh: '市其藥', en: 'Buy' },          effects: [{ kind: 'gold', delta: -200 }],
        outcome: { zh: '此後數旬,軍中傷者收口頗速。', en: 'Soldiers heal faster in the coming seasons.' } },
      { label: { zh: '疑而卻之', en: 'Suspicious — refuse' }, effects: [{ kind: 'none' }],
        outcome: { zh: '醫者悵然收囊而去。', en: 'The physician departs disappointed.' } },
    ],
  },
  {
    id: 'dlg-frontier-tribe',
    speaker: { zh: '塞外使者', en: 'Frontier Envoy' },
    text: {
      zh: '塞外部落遣使奉貢,求開互市。',
      en: 'A tribal chieftain from the frontier offers tribute in exchange for trade rights.',
    },
    choices: [
      { label: { zh: '許其互市', en: 'Grant trade' }, effects: [{ kind: 'gold', delta: 200 }],
        outcome: { zh: '貢物皮革入府,邊市自此不絕。', en: 'You receive tribute and furs.' } },
      { label: { zh: '拒之', en: 'Refuse' },     effects: [{ kind: 'none' }],
        outcome: { zh: '使者忿然而返。', en: 'The envoy departs in anger.' } },
    ],
  },
  {
    id: 'dlg-spy-rumor',
    speaker: { zh: '衛尉屬吏', en: 'Captain of the Guard' },
    text: {
      zh: '傳言府中有敵諜潛伏。可要徹查?',
      en: 'Rumor says a spy lurks within the palace. Order an investigation?',
    },
    choices: [
      { label: { zh: '大索府中', en: 'Full investigation' }, effects: [{ kind: 'gold', delta: -150 }],
        outcome: { zh: '諜者就擒,機密無泄。', en: 'The spy is caught. Secrets remain ours.' } },
      { label: { zh: '置之不問', en: 'Dismiss the rumor' }, effects: [{ kind: 'none' }],
        outcome: { zh: '一時無事 —— 大約。', en: 'Nothing happens. Probably.' } },
    ],
  },
  {
    id: 'dlg-festival',
    speaker: { zh: '太常屬吏', en: 'Minister of Rites' },
    text: {
      zh: '歲首將至,父老請發帑錢以助社祭。',
      en: 'The Spring Festival approaches. The people petition for festival funding.',
    },
    choices: [
      { label: { zh: '大辦其事', en: 'Lavish festival' }, effects: [{ kind: 'gold', delta: -500 }],
        outcome: { zh: '闔境歡騰,士民稱頌。', en: 'The people rejoice and praise their lord.' } },
      { label: { zh: '從簡而行', en: 'A simple celebration' }, effects: [{ kind: 'gold', delta: -100 }],
        outcome: { zh: '百姓亦以為足。', en: 'The people are content.' } },
      { label: { zh: '免了罷', en: 'Skip it' }, effects: [{ kind: 'none' }],
        outcome: { zh: '街巷之間,頗有怨言。', en: 'Murmurs of discontent.' } },
    ],
  },
  {
    id: 'dlg-tax-collector',
    speaker: { zh: '稅吏', en: 'Tax Collector' },
    text: {
      zh: '稅吏稟曰:「今歲田薄,乞減租賦,以蘇民力。」',
      en: 'Tax collector: "The harvest was poor. Consider a tax reduction?"',
    },
    choices: [
      { label: { zh: '減其租賦', en: 'Reduce taxes' },     effects: [{ kind: 'gold', delta: -200 }],
        outcome: { zh: '民心大悅,里閭稱德。', en: 'The people\'s loyalty deepens.' } },
      { label: { zh: '照舊徵足', en: 'Collect in full' }, effects: [{ kind: 'gold', delta: 200 }],
        outcome: { zh: '府庫是滿了,民心卻淡了。', en: 'The treasury swells, but the people grow cold.' } },
    ],
  },
  {
    id: 'dlg-foreign-scholar',
    speaker: { zh: '西域學者', en: 'Foreign Scholar' },
    text: {
      zh: '西來學者求見,願留幕府,以其所學自效。',
      en: 'A scholar from the Western Regions seeks employment at your court.',
    },
    choices: [
      { label: { zh: '留為賓客', en: 'Hire him' },         effects: [{ kind: 'gold', delta: -150 }],
        outcome: { zh: '幕中議論益廣。', en: 'Your court grows in learning.' } },
      { label: { zh: '婉謝之', en: 'Decline' },         effects: [{ kind: 'none' }],
        outcome: { zh: '學者另投他處。', en: 'The scholar seeks elsewhere.' } },
    ],
  },
  {
    id: 'dlg-dragon-sighting',
    speaker: { zh: '漁人', en: 'Fisherman' },
    text: {
      zh: '河上漁人喧傳:曾見黃龍出沒於水中。',
      en: 'Fishermen claim they saw a "yellow dragon" in the river.',
    },
    choices: [
      { label: { zh: '宣為祥瑞', en: 'Proclaim a good omen' }, effects: [{ kind: 'none' }],
        outcome: { zh: '民間歸功於主公之德,歡呼相告。', en: 'The people link it to your virtue and rejoice.' } },
      { label: { zh: '斥為妄語', en: 'Dismiss as superstition' }, effects: [{ kind: 'none' }],
        outcome: { zh: '老臣頗有失望之色。', en: 'Old courtiers seem disappointed.' } },
    ],
  },
  {
    id: 'dlg-runaway-prince',
    speaker: { zh: '市井傳言', en: 'Local Gossip' },
    text: {
      zh: '市井有傳:鄰國少主出奔,匿於我境之內。',
      en: 'A rumor: a young prince from a neighboring realm has fled and is hiding in your domain.',
    },
    choices: [
      { label: { zh: '搜而庇之', en: 'Search and shelter him' }, effects: [{ kind: 'gold', delta: -200 }],
        outcome: { zh: '果然尋得 —— 如今掌中多了一枚人質。', en: 'You find him — and now hold a hostage.' } },
      { label: { zh: '不與其事', en: 'Stay out of it' }, effects: [{ kind: 'none' }],
        outcome: { zh: '此事終無下文。', en: 'Nothing comes of it.' } },
    ],
  },
  {
    id: 'dlg-merchant-caravan',
    speaker: { zh: '商隊長', en: 'Caravan Master' },
    text: {
      zh: '有商隊過境。可要抽其關稅?',
      en: 'A merchant caravan passes through your lands. Levy a toll?',
    },
    choices: [
      { label: { zh: '按例抽稅', en: 'Tax them' },         effects: [{ kind: 'gold', delta: 150 }],
        outcome: { zh: '商賈勉強繳納,面有難色。', en: 'The merchants pay grudgingly.' } },
      { label: { zh: '放行不取', en: 'Let them pass free' }, effects: [{ kind: 'none' }],
        outcome: { zh: '商賈感其寬,沿途稱道主公之名。', en: 'The merchants praise your name as they leave.' } },
    ],
  },
  {
    id: 'dlg-comet-second',
    speaker: { zh: '太史令', en: 'Court Astronomer' },
    text: {
      zh: '異星連現三夜。太史引《易》以奏:「此變動之兆也。」',
      en: 'A strange star has appeared three nights running. The Book of Changes warns of upheaval.',
    },
    choices: [
      { label: { zh: '設祭以禳之', en: 'Conduct a ritual' }, effects: [{ kind: 'gold', delta: -150 }],
        outcome: { zh: '人心稍定。', en: 'Morale steadies.' } },
      { label: { zh: '按之不動', en: 'Do nothing' }, effects: [{ kind: 'none' }],
        outcome: { zh: '境內惶惶,數日不寧。', en: 'People pass anxious days.' } },
    ],
  },
  {
    id: 'dlg-bridge-collapse',
    speaker: { zh: '使者', en: 'Messenger' },
    text: {
      zh: '邊境一橋為暴雨衝毀。工估修費二百金。',
      en: 'A frontier bridge has collapsed in the storm. Repairs cost 200 gold.',
    },
    choices: [
      { label: { zh: '即刻興修', en: 'Repair' },          effects: [{ kind: 'gold', delta: -200 }],
        outcome: { zh: '橋成路通,轉運如故。', en: 'Supply routes restored.' } },
      { label: { zh: '暫且擱置', en: 'Leave it' },         effects: [{ kind: 'none' }],
        outcome: { zh: '轉運遲滯,邊民怨聲日甚。', en: 'Trade slows and discontent rises in the borderlands.' } },
    ],
  },
  {
    id: 'dlg-philosopher-debate',
    speaker: { zh: '儒者', en: 'Confucian Scholar' },
    text: {
      zh: '儒生與道士辯於府門之外,聲聞於堂。主公可要偏袒一方?',
      en: 'A Confucian and a Daoist argue at your court gate. Take a side?',
    },
    choices: [
      { label: { zh: '袒儒生', en: 'Side with the Confucian' }, effects: [{ kind: 'none' }],
        outcome: { zh: '儒林之士自此歸心。', en: 'You gain Confucian support.' } },
      { label: { zh: '袒道士', en: 'Side with the Daoist' }, effects: [{ kind: 'none' }],
        outcome: { zh: '道流之眾自此附之。', en: 'You gain Daoist support.' } },
      { label: { zh: '兩不相袒', en: 'Stay neutral' }, effects: [{ kind: 'none' }],
        outcome: { zh: '兩家皆覺意猶未足。', en: 'Both sides leave a little disappointed.' } },
    ],
  },
  {
    id: 'dlg-old-noble-petition',
    speaker: { zh: '老臣', en: 'Senior Noble' },
    text: {
      zh: '一老臣乞骸骨歸,並薦其門下弟子自代。',
      en: 'An aged minister asks to retire and recommends his protégé.',
    },
    choices: [
      { label: { zh: '即用其弟子', en: 'Appoint the protégé' }, effects: [{ kind: 'none' }],
        outcome: { zh: '新舊相承,無所窒礙。', en: 'A smooth transition.' } },
      { label: { zh: '不准所請', en: 'Refuse the retirement' }, effects: [{ kind: 'none' }],
        outcome: { zh: '老臣復留數年而已。', en: 'The old minister serves a few more years.' } },
    ],
  },
  {
    id: 'dlg-natural-spring',
    speaker: { zh: '農夫', en: 'Farmer' },
    text: {
      zh: '村人來報:「岡上忽湧靈泉!」眾以為異。',
      en: 'Villagers: "A miraculous spring has burst forth on the hill!" A strange omen.',
    },
    choices: [
      { label: { zh: '立祠祀之', en: 'Build a shrine' }, effects: [{ kind: 'gold', delta: -100 }],
        outcome: { zh: '遂成靈地,四方香火不絕。', en: 'It becomes a holy site. Pilgrims gather.' } },
      { label: { zh: '不過一泓泉水', en: 'Treat it as ordinary' }, effects: [{ kind: 'none' }],
        outcome: { zh: '村人自去暗中奉之。', en: 'The villagers quietly venerate it.' } },
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
      zh: '敵營一將密遣人來,願舉身內附:「乞公信我。」',
      en: 'An enemy general has secretly offered to defect. "Trust me," he pleads.',
    },
    choices: [
      {
        label: { zh: '納而用之', en: 'Accept his service' },
        effects: [{ kind: 'gold', delta: -200 }, { kind: 'set-flag', flag: 'accepted-defector' }],
        outcome: { zh: '收之帳下。是忠是詐,下一季自見分曉。', en: 'You take him in. The next season will tell what kind of man he is.' },
        followupEventId: 'dlg-defector-followup',
      },
      {
        label: { zh: '斬之', en: 'Behead him' },
        effects: [{ kind: 'set-flag', flag: 'rejected-defector' }],
        outcome: { zh: '降者不可信。梟其首於轅門之上。', en: 'You trust no turncoat. His head is displayed at the gate.' },
      },
      {
        label: { zh: '禮送而還', en: 'Send him back' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '全其性命,遣之歸營。此事就此了結。', en: 'You send him home unharmed. The matter ends here.' },
      },
    ],
  },
  {
    id: 'dlg-defector-followup',
    speaker: { zh: '巡卒', en: 'Sentry' },
    text: {
      zh: '前季所納之降將,夜半懷我營中地圖潛出,已為巡卒所執!',
      en: 'The defector from last season — we caught him trying to slip out at night with our camp maps!',
    },
    choices: [
      {
        label: { zh: '明正典刑', en: 'Execute as warning' },
        effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '斬之以徇,三軍將士脊背都直了幾分。', en: 'The traitor is executed publicly. Your retainers stand a little straighter.' },
      },
      {
        label: { zh: '授以偽書,縱之', en: 'Feed him false intel and release him' },
        effects: [{ kind: 'none' }, { kind: 'set-flag', flag: 'fed-false-intel' }],
        outcome: { zh: '任其「逃」去,所懷乃偽造之進軍圖。敵中不中此餌,且看。', en: 'You let him "escape" with forged battle plans. Time will tell if the enemy bites.' },
      },
    ],
    conditions: { requiresFlag: 'accepted-defector' },
  },

  // Chain 2: a holy mountain hermit → his disciple returns later if you were generous.
  {
    id: 'dlg-hermit-visit',
    speaker: { zh: '老隱者', en: 'Old Hermit' },
    text: {
      zh: '有隱者自深山來,坐而論道,忽問:「明公之道,安在?」',
      en: 'An old hermit descends from the mountains to lecture on the Way. "Tell me — where lies your path?"',
    },
    choices: [
      {
        label: { zh: '延為上賓', en: 'Welcome him with full honors' },
        effects: [{ kind: 'gold', delta: -80 }, { kind: 'set-flag', flag: 'honored-hermit' }],
        outcome: { zh: '隱者留連數日,談論方罷,欣然而去。', en: 'The hermit converses for days, then departs satisfied.' },
        followupEventId: 'dlg-hermit-disciple',
      },
      {
        label: { zh: '但進粗食', en: 'Offer him only cold rations' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '隱者一言不發,拂衣而去。', en: 'The hermit departs without a word.' },
      },
      {
        label: { zh: '逐之出境', en: 'Drive him off' },
        effects: [{ kind: 'set-flag', flag: 'scorned-hermit' }],
        outcome: { zh: '隱者且行且詈,語多不祥。', en: 'The hermit leaves muttering curses.' },
      },
    ],
  },
  {
    id: 'dlg-hermit-disciple',
    speaker: { zh: '少年弟子', en: 'Young Disciple' },
    text: {
      zh: '一少年自稱隱者門人,持其師遺言來謁。目光炯然,才氣可見。',
      en: 'A young man arrives saying he is the late hermit\'s disciple. His eyes are sharp; talent is plain.',
    },
    choices: [
      {
        label: { zh: '納為麾下', en: 'Take him as a retainer' },
        effects: [{ kind: 'gold', delta: -50 }],
        outcome: { zh: '一員新銳入於幕中。', en: 'A new talent joins your camp.' },
      },
      {
        label: { zh: '贈以路資', en: 'Give him travel money and send him on' },
        effects: [{ kind: 'gold', delta: -20 }],
        outcome: { zh: '少年拜謝,另尋明主去了。', en: 'He goes to seek service elsewhere.' },
      },
    ],
    conditions: { requiresFlag: 'honored-hermit' },
  },

  // Chain 3: famine relief → townspeople remember.
  {
    id: 'dlg-famine-village',
    speaker: { zh: '里長', en: 'Village Elder' },
    text: {
      zh: '某村歲歉,野無青草。里長叩首乞賑。',
      en: 'A village suffers a poor harvest. The elder begs for relief grain.',
    },
    choices: [
      {
        label: { zh: '開倉賑之', en: 'Open the granaries' },
        effects: [{ kind: 'gold', delta: -150 }, { kind: 'set-flag', flag: 'opened-granaries' }],
        outcome: { zh: '一村得活,遠近皆頌主公之德。', en: 'The village survives. Your name is praised everywhere.' },
        followupEventId: 'dlg-grateful-villagers',
      },
      {
        label: { zh: '減半發給', en: 'Send half what they ask' },
        effects: [{ kind: 'gold', delta: -75 }],
        outcome: { zh: '雖不足用,村中勉強撐過。', en: 'Not enough, but they survive — barely.' },
      },
      {
        label: { zh: '不與', en: 'Refuse' },
        effects: [{ kind: 'set-flag', flag: 'refused-relief' }],
        outcome: { zh: '村人自此銜恨,詛咒不絕。', en: 'The village curses your name.' },
      },
    ],
  },
  {
    id: 'dlg-grateful-villagers',
    speaker: { zh: '村中少年', en: 'Village Youth' },
    text: {
      zh: '前番賑糧之恩,村中未敢或忘。今率子弟數十,願從軍效死!',
      en: 'We have not forgotten the grain you sent. The young men of our village wish to enlist!',
    },
    choices: [
      {
        label: { zh: '欣然納之', en: 'Welcome them' },
        effects: [{ kind: 'gold', delta: -30 }],
        outcome: { zh: '義從入伍,行伍為之一壯。', en: 'Volunteers swell your ranks.' },
      },
      {
        label: { zh: '遣歸田畝', en: 'Send them back to the fields' },
        effects: [{ kind: 'none' }],
        outcome: { zh: '諭以農為邦本,好生耕稼,勿輕言戰。', en: 'You remind them that farming is the root of the state.' },
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
    id: 'dlg-swordsmith',
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

  // ─── 2026-07 補:麾下名將情境進言 ───
  // 只在該將真正效力於你麾下時觸發(requiresOfficerInService),說話者即其本人立繪。
  // 抉擇多牽動「該將忠誠」——你的班底在對你說話,而非泛化路人。
  {
    id: 'dlg-guanyu-sortie',
    speakerOfficerId: 'guan-yu',
    text: { zh: '關羽按劍出班,丹鳳目微張:「主公,敵酋屢屢遣使耀武,某不才,願提一軍取其首級,以獻於帳下!」', en: 'Guan Yu steps forth, hand on his blade: "My lord, the enemy chief sends heralds to flaunt his strength. Grant me one column — I will take his head and lay it before your tent."' },
    choices: [
      { label: { zh: '壯其志,准其出戰', en: 'Honour his spirit — let him march' }, effects: [{ kind: 'loyalty', officerId: 'guan-yu', delta: 4 }, { kind: 'set-flag', flag: 'guanyu-sortie' }], outcome: { zh: '雲長橫刀上馬,三軍望其背影而奮。', en: 'Yunchang mounts, blade level; the host takes heart at his back.' }, followupEventId: 'dlg-guanyu-triumph' },
      { label: { zh: '嘉其勇,然令持重', en: 'Praise his valour, but bid him hold' }, effects: [{ kind: 'loyalty', officerId: 'guan-yu', delta: -2 }], outcome: { zh: '關羽默然還班,似有不甘,然亦服令。', en: 'He returns to rank in silence — reluctant, yet obedient.' } },
    ],
    conditions: { requiresOfficerInService: 'guan-yu' },
  },
  {
    // followup — 由「准其出戰」排入,次季自動觸發。
    id: 'dlg-guanyu-triumph',
    speakerOfficerId: 'guan-yu',
    text: { zh: '關羽提一血囊還營,擲於階下:「幸不辱命。然某見敵陣尚整,驕之則敗,願主公毋以一勝而輕之。」', en: 'Guan Yu returns and casts a blood-sack at the steps: "I did not fail you. Yet their lines held firm — one win breeds folly. Do not think them light, my lord."' },
    choices: [
      { label: { zh: '納其言,重賞三軍', en: 'Heed him, reward the host richly' }, effects: [{ kind: 'gold', delta: -60 }, { kind: 'loyalty', officerId: 'guan-yu', delta: 3 }], outcome: { zh: '賞行而戒溢,將士既喜且警。', en: 'Rewards flow but pride is checked; the men are glad yet wary.' } },
      { label: { zh: '大宴以彰武功', en: 'Feast lavishly to trumpet the triumph' }, effects: [{ kind: 'gold', delta: -40 }, { kind: 'set-flag', flag: 'army-boastful' }], outcome: { zh: '軍中歡騰,然關羽獨蹙眉不語。', en: 'The camp roars — but Guan Yu alone frowns, and says nothing.' } },
    ],
  },
  {
    id: 'dlg-zhangfei-vanguard',
    speakerOfficerId: 'zhang-fei',
    text: { zh: '張飛環眼圓睜,聲若巨雷:「哥哥!整日按兵不動,鳥都要生蛆了!前部先鋒,俺老張去也,誰敢攔我?」', en: 'Zhang Fei glares, voice like thunder: "Brother! Sitting idle till the birds rot! Give me the vanguard — old Zhang goes first, and who dares block me?"' },
    choices: [
      { label: { zh: '許其為先鋒,誡勿嗜酒', en: 'Grant the van — but warn off the wine' }, effects: [{ kind: 'loyalty', officerId: 'zhang-fei', delta: 3 }, { kind: 'set-flag', flag: 'zhangfei-warned' }], outcome: { zh: '張飛拍胸領命,誓不飲於陣前。', en: 'He slaps his chest and swears off drink before battle.' } },
      { label: { zh: '斥其粗魯,令歸帳', en: 'Rebuke his rashness, send him back' }, effects: [{ kind: 'loyalty', officerId: 'zhang-fei', delta: -4 }], outcome: { zh: '翼德忿忿而退,是夜帳中隱有酒氣。', en: 'Yide storms off; that night, wine hangs in his tent.' } },
    ],
    conditions: { requiresOfficerInService: 'zhang-fei' },
  },
  {
    id: 'dlg-zhaoyun-remonstrate',
    speakerOfficerId: 'zhao-yun',
    text: { zh: '趙雲肅然進諫:「主公,霸業以民為本。今若奪田宅以賞將士,恐失黎庶之心。雲以為,天下未定,不宜先享其成。」', en: 'Zhao Yun counsels gravely: "My lord, hegemony rests on the people. To seize their fields for the soldiers is to lose the commons\' hearts. The realm is unsettled — this is no hour to feast on the spoils."' },
    choices: [
      { label: { zh: '從子龍之諫,還田於民', en: 'Heed Zilong — return the land' }, effects: [{ kind: 'loyalty', officerId: 'zhao-yun', delta: 4 }, { kind: 'set-flag', flag: 'zhaoyun-heeded' }], outcome: { zh: '民聞之而悅,皆稱主公有仁君之風。', en: 'The people rejoice, calling you a lord of benevolence.' } },
      { label: { zh: '嘉其言而未能盡從', en: 'Praise the words, but not fully act' }, effects: [{ kind: 'none' }], outcome: { zh: '趙雲長揖而退,神色間微有憾焉。', en: 'Zhao Yun bows and withdraws, a shade of regret in his face.' } },
    ],
    conditions: { requiresOfficerInService: 'zhao-yun' },
  },
  {
    id: 'dlg-zhouyu-qin',
    speakerOfficerId: 'zhou-yu',
    text: { zh: '周瑜撫琴一曲,弦斷而笑:「主公可知?曲有誤,周郎顧。今天下三分之勢已萌,願為主公審音辨勢,擇一可圖之敵。」', en: 'Zhou Yu plays; a string snaps and he smiles: "A flawed note, and Zhou Lang turns his head. The realm bends toward threefold division — let me read the tune of it, and mark you a foe worth taking."' },
    choices: [
      { label: { zh: '請其定聯弱攻強之策', en: 'Bid him plan: ally the weak, strike the strong' }, effects: [{ kind: 'loyalty', officerId: 'zhou-yu', delta: 3 }, { kind: 'set-flag', flag: 'zhouyu-grand-plan' }], outcome: { zh: '公瑾撫掌而定方略,江東為之一振。', en: 'Gongjin claps and sets the design; the Southland stirs.' } },
      { label: { zh: '笑其自負,未置可否', en: 'Smile at his conceit, commit to nothing' }, effects: [{ kind: 'loyalty', officerId: 'zhou-yu', delta: -3 }], outcome: { zh: '周瑜斂容,曰:「既生瑜……」語未竟而止。', en: 'Zhou Yu\'s face cools: "That Heaven bore Yu..." — he stops mid-phrase.' } },
    ],
    conditions: { requiresOfficerInService: 'zhou-yu' },
  },
  {
    id: 'dlg-simayi-bide',
    speakerOfficerId: 'sima-yi',
    text: { zh: '司馬懿俯身低語:「主公,鷙鳥將擊,必斂其翼;猛獸將搏,必伏其形。今銳氣正盛之敵,不可爭鋒,宜示弱以驕之,待其懈而後動。」', en: 'Sima Yi murmurs low: "My lord — the hawk folds its wings before the strike, the beast crouches before the pounce. Do not clash with a foe at his sharpest; feign weakness, let his pride swell, then move when he slackens."' },
    choices: [
      { label: { zh: '善其謀,深自韜晦', en: 'Approve — bide and conceal' }, effects: [{ kind: 'loyalty', officerId: 'sima-yi', delta: 3 }, { kind: 'set-flag', flag: 'simayi-biding' }], outcome: { zh: '仲達頷首而退,鋒芒盡斂於袖。', en: 'Zhongda nods and withdraws, every edge tucked in his sleeve.' } },
      { label: { zh: '疑其懷貳,加意提防', en: 'Suspect his heart — watch him closer' }, effects: [{ kind: 'loyalty', officerId: 'sima-yi', delta: -2 }, { kind: 'set-flag', flag: 'simayi-watched' }], outcome: { zh: '司馬懿察主公之疑,益發恭謹,而心事愈深。', en: 'Sensing your doubt, he grows yet more deferent — and his mind, deeper still.' } },
    ],
    conditions: { requiresOfficerInService: 'sima-yi' },
  },
  {
    id: 'dlg-jiaxu-coldcounsel',
    speakerOfficerId: 'jia-xu',
    text: { zh: '賈詡屏退左右,徐徐言曰:「明公,鄰邦二雄相攻,兩敗俱傷,此天賜之機也。詡有一計,可使其鬥而不能解——然此計傷天和,明公用否?」', en: 'Jia Xu clears the room and speaks slow: "My lord — two rival powers grind on each other, both bleeding. Heaven hands you the hour. I hold a stratagem to lock them in a fight none can break — though it wounds the harmony of Heaven. Will you use it?"' },
    choices: [
      { label: { zh: '用其計,坐收漁利', en: 'Use it — reap while they bleed' }, effects: [{ kind: 'loyalty', officerId: 'jia-xu', delta: 2 }, { kind: 'set-flag', flag: 'jiaxu-scheme' }], outcome: { zh: '文和微微一笑,不復多言,自去行事。', en: 'Wenhe smiles thinly, says no more, and goes to his work.' }, followupEventId: 'dlg-jiaxu-fruit' },
      { label: { zh: '斥其陰狠,不忍為之', en: 'Reject it — too ruthless to bear' }, effects: [{ kind: 'none' }], outcome: { zh: '賈詡拱手曰:「明公仁厚,詡失言。」退而自晦。', en: '"My lord is kind; I misspoke." He bows and dims himself again.' } },
    ],
    conditions: { requiresOfficerInService: 'jia-xu' },
  },
  {
    id: 'dlg-jiaxu-fruit',
    speakerOfficerId: 'jia-xu',
    text: { zh: '數旬之後,賈詡復來:「明公,二敵果已成仇,鏖兵不解。今其一遣使乞盟於我,願割地相結——受之則得地,拒之則彼疑我而益鬥。」', en: 'Weeks on, Jia Xu returns: "As foretold, the two are locked in blood-feud. One now sues us for alliance, offering land — take it and gain ground; refuse, and their suspicion drives them deeper into war."' },
    choices: [
      { label: { zh: '受其盟,納其地', en: 'Take the pact and the land' }, effects: [{ kind: 'gold', delta: 80 }, { kind: 'loyalty', officerId: 'jia-xu', delta: 2 }], outcome: { zh: '不費一卒而拓境,群下服文和之算。', en: 'Ground won without a spear; all bow to Wenhe\'s reckoning.' } },
      { label: { zh: '拒其盟,俾其相鬥愈烈', en: 'Refuse — let them tear on' }, effects: [{ kind: 'set-flag', flag: 'jiaxu-let-bleed' }], outcome: { zh: '二敵猜貳日深,兵連禍結,無暇他顧。', en: 'The two rot in mutual doubt, war upon war, blind to all else.' } },
    ],
  },
  {
    id: 'dlg-guojia-sickstrat',
    speakerOfficerId: 'guo-jia',
    text: { zh: '郭嘉抱病強起,面色蒼白而目光炯炯:「主公,嘉觀敵有十敗,主公有十勝。彼外寬內忌,用人而疑之;主公唯才是任,此德勝也。急擊之,可一戰而定!」', en: 'Guo Jia rises though ill, pale but bright-eyed: "My lord — the foe has ten defeats, you ten victories. He is lax without, jealous within, trusting none he uses; you employ by merit alone. Strike now — one battle settles it!"' },
    choices: [
      { label: { zh: '從奉孝之策,急擊之', en: 'Follow Fengxiao — strike at once' }, effects: [{ kind: 'loyalty', officerId: 'guo-jia', delta: 4 }, { kind: 'set-flag', flag: 'guojia-tenwins' }], outcome: { zh: '郭嘉扶病定謀,聞者無不奮激。', en: 'Guo Jia lays the plan through his sickness; none who hear are unmoved.' } },
      { label: { zh: '憐其病,勸其先自將養', en: 'Pity his illness — bid him rest first' }, effects: [{ kind: 'loyalty', officerId: 'guo-jia', delta: 2 }, { kind: 'gold', delta: -30 }], outcome: { zh: '奉孝感主公之恩,曰:「嘉之壽,願盡與主公。」', en: 'Moved, Fengxiao says: "What years I have, I give wholly to my lord."' } },
    ],
    conditions: { requiresOfficerInService: 'guo-jia' },
  },
  {
    id: 'dlg-lubu-demand',
    speakerOfficerId: 'lu-bu',
    text: { zh: '呂布按戟昂立,睥睨帳中:「某手中方天畫戟,天下誰能當之?區區封賞,何薄如此?主公若欲某效死,當有以厚我!」', en: 'Lu Bu stands over his halberd, sneering round the tent: "This Sky-Piercer of mine — who under Heaven withstands it? Yet my reward is this thin? If my lord wants me to die for him, reward me richly!"' },
    choices: [
      { label: { zh: '厚賜金帛,以安其心', en: 'Shower gold to settle him' }, effects: [{ kind: 'gold', delta: -100 }, { kind: 'loyalty', officerId: 'lu-bu', delta: 6 }], outcome: { zh: '呂布大悅,然左右竊議:「養虎終為患。」', en: 'Lu Bu is delighted — yet aides whisper: "A fed tiger is still a tiger."' } },
      { label: { zh: '正色責其貪功', en: 'Sternly rebuke his greed' }, effects: [{ kind: 'loyalty', officerId: 'lu-bu', delta: -8 }, { kind: 'set-flag', flag: 'lubu-slighted' }], outcome: { zh: '溫侯拂袖冷笑,自此心懷怏怏。', en: 'The Marquis snorts and turns away, sullen from that hour.' } },
    ],
    conditions: { requiresOfficerInService: 'lu-bu' },
  },
  {
    id: 'dlg-huangzhong-oldwar',
    speakerOfficerId: 'huang-zhong',
    text: { zh: '黃忠開三石之弓,箭無虛發,朗聲曰:「主公勿以某年老。廉頗雖老,尚能一飯斗米;某雖白首,取敵將首級,猶探囊耳!請為前部。」', en: 'Huang Zhong draws a three-stone bow, every shaft true: "Count me not old, my lord. Aged Lian Po still ate a peck at a sitting; white-haired as I am, taking an enemy general\'s head is like reaching into a bag. Grant me the van."' },
    choices: [
      { label: { zh: '壯其老而彌堅,許之', en: 'Honour the old lion — grant it' }, effects: [{ kind: 'loyalty', officerId: 'huang-zhong', delta: 4 }, { kind: 'set-flag', flag: 'huangzhong-van' }], outcome: { zh: '老將軍披甲上馬,英姿不減當年。', en: 'The old general armours up and mounts, his mettle undimmed.' } },
      { label: { zh: '恤其年高,令居後鎮', en: 'Spare his years — post him to the rear' }, effects: [{ kind: 'loyalty', officerId: 'huang-zhong', delta: -3 }], outcome: { zh: '黃忠悵然:「大丈夫當死於疆場,豈老於牖下?」', en: 'Huang Zhong sighs: "A true man should die on the field — not wither by a window."' } },
    ],
    conditions: { requiresOfficerInService: 'huang-zhong' },
  },
  {
    id: 'dlg-jiangwei-legacy',
    speakerOfficerId: 'jiang-wei',
    text: { zh: '姜維捧武侯遺書,泣而請曰:「丞相以興復之志託維,今中原可圖。維雖不才,願繼承相志,提兵北向,鞠躬盡瘁,死而後已!」', en: 'Jiang Wei holds the late Chancellor\'s testament and weeps: "The Prime Minister entrusted me the will to restore the Han. The heartland lies open. Unworthy though I am, I would carry on his charge — march north, and give my utmost till death."' },
    choices: [
      { label: { zh: '成其志,發兵北伐', en: 'Fulfil the charge — march north' }, effects: [{ kind: 'loyalty', officerId: 'jiang-wei', delta: 5 }, { kind: 'set-flag', flag: 'jiangwei-northern' }], outcome: { zh: '姜維誓師出隴,三軍縞素,如見武侯。', en: 'Jiang Wei musters at Long; the host in mourning-white, as if the Chancellor watched.' } },
      { label: { zh: '慮國力未充,勸其緩圖', en: 'Fear the realm too weak — bid him wait' }, effects: [{ kind: 'loyalty', officerId: 'jiang-wei', delta: -2 }, { kind: 'set-flag', flag: 'jiangwei-restrained' }], outcome: { zh: '伯約含淚受命,然中夜常撫劍北望。', en: 'Boyue takes the order in tears — yet at midnight oft grips his sword, gazing north.' } },
    ],
    conditions: { requiresOfficerInService: 'jiang-wei' },
  },
  {
    id: 'dlg-luxun-prudence',
    speakerOfficerId: 'lu-xun',
    text: { zh: '陸遜年少而持重,從容進言:「主公,敵勢雖張,然勞師遠來,利在速戰;我宜堅壁挫其銳,待其糧盡氣衰,一舉可破。願主公假我以歲月,勿迫於一時。」', en: 'Young but steady, Lu Xun advises calmly: "My lord, the foe swells, yet marched far and weary — his gain lies in a quick fight. Wall up and blunt his edge; when his grain fails and spirit sags, one stroke breaks him. Grant me time, and do not press for a single day\'s result."' },
    choices: [
      { label: { zh: '委以全權,任其持重', en: 'Grant full command — let him hold' }, effects: [{ kind: 'loyalty', officerId: 'lu-xun', delta: 4 }, { kind: 'set-flag', flag: 'luxun-command' }], outcome: { zh: '諸將初輕其年少,久之乃服其沉毅。', en: 'The captains scorned his youth at first — in time they bow to his depth.' } },
      { label: { zh: '疑其怯戰,促令速決', en: 'Doubt his nerve — press for a quick decision' }, effects: [{ kind: 'loyalty', officerId: 'lu-xun', delta: -3 }], outcome: { zh: '陸遜默受其責,然堅執己見,不肯浪戰。', en: 'Lu Xun takes the reproach in silence — yet holds his ground, refusing a reckless fight.' } },
    ],
    conditions: { requiresOfficerInService: 'lu-xun' },
  },
  {
    id: 'dlg-xuchu-nightwatch',
    speakerOfficerId: 'xu-chu',
    text: { zh: '許褚裸衣按刀,守於帳外,入而言曰:「主公,近日營中夜有異動,恐有刺客。褚願親宿帳前,雖萬人不能近主公一步!」', en: 'Xu Chu, stripped to the waist and gripping his blade, keeps the tent-door, then enters: "My lord, the camp stirs strangely by night — I fear assassins. Let me sleep before your tent; though ten thousand come, none shall step within a pace of you!"' },
    choices: [
      { label: { zh: '嘉其忠,命其宿衛', en: 'Honour his loyalty — post him to the guard' }, effects: [{ kind: 'loyalty', officerId: 'xu-chu', delta: 3 }, { kind: 'set-flag', flag: 'xuchu-guard' }], outcome: { zh: '虎痴徹夜按刀而立,主公得安寢。', en: 'The Tiger-Fool stands sword in hand all night; you sleep sound.' } },
      { label: { zh: '笑其多慮,遣之歸歇', en: 'Laugh off his worry — send him to rest' }, effects: [{ kind: 'none' }], outcome: { zh: '許褚不肯遠去,竟臥於帳側階前。', en: 'Xu Chu will not go far — he lies down on the steps beside the tent.' } },
    ],
    conditions: { requiresOfficerInService: 'xu-chu' },
  },
  {
    id: 'dlg-zhangliao-charge',
    speakerOfficerId: 'zhang-liao',
    text: { zh: '張遼按劍請纓:「主公,敵眾我寡,然彼新集,陣腳未固。遼願選死士八百,乘夜陷其陣,先挫其鋒,則我軍雖少可守。此逍遙津故智也!」', en: 'Zhang Liao asks leave, hand on hilt: "My lord — they are many, we few, but freshly gathered and their ranks unset. Let me pick eight hundred braves and break their line by night; blunt their edge, and our small host can hold. This was the trick of Xiaoyao Ford!"' },
    choices: [
      { label: { zh: '壯其膽,選死士予之', en: 'Honour his daring — give him the braves' }, effects: [{ kind: 'loyalty', officerId: 'zhang-liao', delta: 4 }, { kind: 'set-flag', flag: 'zhangliao-raid' }], outcome: { zh: '張遼夜銜枚陷陣,敵驚呼「遼來!」而潰。', en: 'Zhang Liao charges by night; the foe cries "Liao comes!" and breaks.' } },
      { label: { zh: '慮其行險,令固守待援', en: 'Fear the risk — bid him hold for relief' }, effects: [{ kind: 'loyalty', officerId: 'zhang-liao', delta: -1 }], outcome: { zh: '文遠斂鋒堅守,然每念未得逞其志。', en: 'Wenyuan sheathes his edge and holds — though he broods on the chance untaken.' } },
    ],
    conditions: { requiresOfficerInService: 'zhang-liao' },
  },
  {
    id: 'dlg-dianwei-guard',
    speakerOfficerId: 'dian-wei',
    text: { zh: '典韋持雙戟立於轅門,聲如洪鐘:「主公放心飲宴,俺典韋在此,便是天塌下來,也替主公頂著!」', en: 'Dian Wei stands at the gate with twin halberds, voice booming: "Feast easy, my lord — with Dian Wei here, though the sky fall, I\'ll hold it up for you!"' },
    choices: [
      { label: { zh: '賜酒以勞其忠', en: 'Grant him wine for his loyalty' }, effects: [{ kind: 'gold', delta: -20 }, { kind: 'loyalty', officerId: 'dian-wei', delta: 3 }], outcome: { zh: '典韋痛飲而不亂,終夜按戟不倒。', en: 'Dian Wei drinks deep yet steady, halberds unwavering till dawn.' } },
      { label: { zh: '誡其勿因宴而弛備', en: 'Warn him not to slacken for the feast' }, effects: [{ kind: 'loyalty', officerId: 'dian-wei', delta: 1 }, { kind: 'set-flag', flag: 'dianwei-vigilant' }], outcome: { zh: '典韋領命,益發戒嚴,滴酒不沾。', en: 'He takes heed, tightens the watch, and touches not a drop.' } },
    ],
    conditions: { requiresOfficerInService: 'dian-wei' },
  },

  // ─── 2026-07 補:麾下重臣薦賢(荐賢入仕,exercise recruit effect)───
  // 只在薦主效力於你時觸發;所薦之才若尚未歸你,則應召入仕(recruit)。
  {
    id: 'dlg-xushu-recommend',
    speakerOfficerId: 'xu-shu',
    text: { zh: '徐庶臨行回馬,鄭重進言:「庶此去,身在曹營,然有一言相告:南陽有臥龍諸葛孔明,經天緯地之才,勝庶十倍。主公若得之,何愁大業不成?宜親往求之。」', en: 'Xu Shu wheels his horse back and speaks in earnest: "I go — my body to Cao\'s camp — yet one word before I part: in Nanyang dwells the Crouching Dragon, Zhuge Kongming, whose gift to weave Heaven and Earth is ten times mine. Win him, my lord, and what great work could fail? Go to him yourself."' },
    choices: [
      { label: { zh: '納其薦,三顧茅廬', en: 'Heed the counsel — visit the thatched hut thrice' }, effects: [{ kind: 'recruit', officerId: 'zhuge-liang' }, { kind: 'set-flag', flag: 'sought-crouching-dragon' }], outcome: { zh: '主公枉駕三顧,臥龍感其誠,遂出隆中。', en: 'Thrice you call in person; moved by your sincerity, the Dragon leaves Longzhong.' } },
      { label: { zh: '謝其意,未遑往聘', en: 'Thank him — but do not yet go' }, effects: [{ kind: 'loyalty', officerId: 'xu-shu', delta: -2 }], outcome: { zh: '徐庶嘆息而去,惜明主失此大賢。', en: 'Xu Shu sighs as he leaves, grieving that a worthy lord let such a sage slip.' } },
    ],
    conditions: { requiresOfficerInService: 'xu-shu' },
  },
  {
    id: 'dlg-xunyu-recommend',
    speakerOfficerId: 'xun-yu',
    text: { zh: '荀彧薦士曰:「明公欲成霸業,不可無奇謀之士。潁川郭嘉,才策謀略,世之奇士,雖行止不謹,然算無遺策。彧敢以身家保之,願明公用焉。」', en: 'Xun Yu recommends: "To forge hegemony, my lord, you cannot lack a mind for wild stratagem. Guo Jia of Yingchuan — a rare talent of the age; loose in conduct, yet flawless in reckoning. I stake my house upon him. Employ him, I beg."' },
    choices: [
      { label: { zh: '用文若之薦,徵郭嘉', en: 'Take Wenruo\'s word — summon Guo Jia' }, effects: [{ kind: 'recruit', officerId: 'guo-jia' }, { kind: 'loyalty', officerId: 'xun-yu', delta: 2 }], outcome: { zh: '郭嘉應召而至,一席暢談,主公大喜曰:「使孤成大業者,必此人也!」', en: 'Guo Jia answers the call; after one long talk you cry: "The man to make my great work — surely this is he!"' } },
      { label: { zh: '嫌其不羈,姑置之', en: 'Balk at his looseness — set it aside' }, effects: [{ kind: 'none' }], outcome: { zh: '荀彧默然,惜奇才之見遺。', en: 'Xun Yu falls silent, mourning a rare talent passed over.' } },
    ],
    conditions: { requiresOfficerInService: 'xun-yu' },
  },
  {
    id: 'dlg-lusu-recommend',
    speakerOfficerId: 'lu-su',
    text: { zh: '魯肅引一貌陋之士入見:「主公,此鳳雛龐士元也,與臥龍齊名,得一可安天下。其貌雖不揚,然腹有良謀,願主公勿以貌取人。」', en: 'Lu Su leads in a homely-looking man: "My lord — this is Pang Shiyuan, the Fledgling Phoenix, ranked with the Crouching Dragon; win either and the realm may be settled. Plain of face, but his belly holds fine schemes. Judge him not by his looks."' },
    choices: [
      { label: { zh: '不以貌取,即拜為軍師', en: 'Look past the face — appoint him strategist' }, effects: [{ kind: 'recruit', officerId: 'pang-tong' }, { kind: 'loyalty', officerId: 'lu-su', delta: 2 }], outcome: { zh: '龐統試以百里之政,半日剖決,積案一空,眾始服之。', en: 'Given a county to test, Pang Tong clears its backlog by noon; all are won over.' } },
      { label: { zh: '見其貌陋,禮貌而疏', en: 'Put off by his looks — polite but cool' }, effects: [{ kind: 'loyalty', officerId: 'lu-su', delta: -2 }], outcome: { zh: '龐統拂衣而去,魯肅頓足歎主公之失。', en: 'Pang Tong strides off; Lu Su stamps his foot at his lord\'s loss.' } },
    ],
    conditions: { requiresOfficerInService: 'lu-su' },
  },

  // ─── 2026-07 補:讖緯・天象・童謠(隨國勢觸發的祥瑞/災異/謠讖)───
  // 天人感應是漢季政治的底色 —— 星變主兵喪、祥瑞徵天命、童謠洩人心。
  // 多為觀賞+set-flag,少數可禳祭(gold)。有史實年限者以 minYear/maxYear 錨定。
  {
    id: 'dlg-omen-mars-heart',
    speaker: { zh: '太史令', en: 'The Grand Astrologer' },
    text: { zh: '太史令夜觀天象,惶恐入奏:「熒惑守心,此至凶之兆也!主大喪,或有大臣當之。願主公修德禳災,以答天譴。」', en: 'The Grand Astrologer reports in dread: "Mars lingers in the Heart mansion — a most dire sign! It portends a great death, perhaps of a high minister. Cultivate virtue and avert the calamity, my lord, to answer Heaven\'s reproach."' },
    choices: [
      { label: { zh: '大赦天下,修德禳之', en: 'Proclaim amnesty, cultivate virtue to avert it' }, effects: [{ kind: 'gold', delta: -60 }, { kind: 'set-flag', flag: 'omen-mars-averted' }], outcome: { zh: '詔下大赦,民感其德,人心稍安。', en: 'Amnesty is decreed; the people take heart, and the unease eases.' } },
      { label: { zh: '古有移禍之說,卻之不祥', en: 'Some would shift the doom onto another — you refuse' }, effects: [{ kind: 'set-flag', flag: 'omen-mars-refused' }], outcome: { zh: '主公曰:「移禍於下,吾不忍也。」左右肅然。', en: '"To cast the doom onto those below — this I cannot bear." All fall silent in awe.' } },
      { label: { zh: '天道玄遠,秘而不宣', en: 'Heaven\'s ways are remote — keep it quiet' }, effects: [{ kind: 'none' }], outcome: { zh: '事秘不聞於外,然帳中人皆惴惴。', en: 'The matter is hushed — yet dread lingers in the tent.' } },
    ],
  },
  {
    id: 'dlg-omen-comet-taiwei',
    speaker: { zh: '太史令', en: 'The Grand Astrologer' },
    text: { zh: '太史令奏:「有長星孛于太微,掃帝座之側。彗之為言,除舊布新也。天下恐將有兵革之變,願早為之備。」', en: 'The Astrologer reports: "A long comet sweeps the Grand Tenuity, brushing the imperial seat. A comet speaks of sweeping out the old for the new — arms and upheaval may come. Prepare early, my lord."' },
    choices: [
      { label: { zh: '整軍經武,以待其變', en: 'Ready the army against the coming change' }, effects: [{ kind: 'gold', delta: -50 }, { kind: 'set-flag', flag: 'omen-comet-armed' }], outcome: { zh: '繕甲厲兵,三軍戒嚴,人謂主公有先見。', en: 'Armour is mended and blades honed; men call their lord far-sighted.' } },
      { label: { zh: '謂彗主除舊,正應吾興', en: 'Read the broom-star as sweeping the old — it heralds YOUR rise' }, effects: [{ kind: 'set-flag', flag: 'omen-comet-mandate' }], outcome: { zh: '主公笑曰:「除舊布新,豈非為吾乎?」眾心為之一壯。', en: '"Sweep out the old for the new — is that not for me?" The host\'s spirit lifts.' } },
    ],
  },
  {
    id: 'dlg-omen-white-rainbow',
    speaker: { zh: '郡中父老', en: 'Village Elders' },
    text: { zh: '郡中傳:白虹貫日,經天而不散。古謂「白虹貫日,人主有憂」,又雲刺客之兆。市井洶洶,人心不安。', en: 'From the county: a white rainbow pierced the sun and hung unbroken across the sky. The old saying runs — "a white rainbow through the sun, the sovereign has cause for grief," and some name it an assassin\'s omen. The streets churn with unease.' },
    choices: [
      { label: { zh: '嚴宿衛,防不測', en: 'Tighten the guard against the unforeseen' }, effects: [{ kind: 'gold', delta: -30 }, { kind: 'set-flag', flag: 'omen-guard-doubled' }], outcome: { zh: '增衛倍嚴,主公寢食俱安。', en: 'The watch is doubled; the lord sleeps and dines at ease.' } },
      { label: { zh: '出榜安民,言天象無常', en: 'Post notices to calm the folk — omens are fickle' }, effects: [{ kind: 'set-flag', flag: 'omen-rainbow-calmed' }], outcome: { zh: '榜諭既出,訛言漸息。', en: 'Once the notices go up, the rumours fade.' } },
    ],
  },
  {
    id: 'dlg-omen-eclipse',
    speaker: { zh: '太史令', en: 'The Grand Astrologer' },
    text: { zh: '白晝忽晦,日有食之,雞棲犬吠,百姓驚駭伏地。太史令奏:「日者,君象也;日食,陰侵陽也。宜避正殿、減膳、責躬以答之。」', en: 'Day turns to dusk; the sun is eaten, fowl roost and dogs bark, and the people fall prostrate in terror. The Astrologer says: "The sun is the image of the sovereign; its eclipse is the shadow encroaching on the light. Quit the main hall, reduce your table, and take the blame upon yourself."' },
    choices: [
      { label: { zh: '避殿減膳,下詔責躬', en: 'Quit the hall, reduce fare, issue a self-reproaching edict' }, effects: [{ kind: 'set-flag', flag: 'omen-eclipse-humbled' }], outcome: { zh: '主公謙抑答天,朝野稱其能畏天命。', en: 'The lord humbles himself before Heaven; court and country praise his awe of the Mandate.' } },
      { label: { zh: '厚賚太史,令詳察災異', en: 'Reward the Astrologer, bid him watch the skies closely' }, effects: [{ kind: 'gold', delta: -20 }, { kind: 'none' }], outcome: { zh: '太史夜夜候台,災祥皆有所稽。', en: 'The Astrologer keeps his tower nightly; every sign is set on record.' } },
    ],
  },
  {
    id: 'dlg-omen-five-planets',
    speaker: { zh: '太史令', en: 'The Grand Astrologer' },
    text: { zh: '太史令大喜而奏:「五星如連珠,聚於東井之分!昔漢高入關,五星聚東井,遂有天下。此受命之君當興之兆也,大吉!」', en: 'The Astrologer reports in joy: "The five planets align like a strung pearl, gathered in the Eastern Well! When Han\'s founder entered the passes, so they gathered — and he won the realm. This heralds the rise of one who holds the Mandate. Most auspicious!"' },
    choices: [
      { label: { zh: '告於宗廟,昭天命所歸', en: 'Announce it at the ancestral shrine — the Mandate falls to you' }, effects: [{ kind: 'set-flag', flag: 'omen-five-planets-mandate' }], outcome: { zh: '祭告宗廟,將士益信主公有天命,士氣大振。', en: 'Proclaimed at the shrine; the host believes ever more in their lord\'s Mandate, and spirits soar.' } },
      { label: { zh: '謙抑不居,曰未敢當', en: 'Demur — you dare not claim it' }, effects: [{ kind: 'gold', delta: 40 }, { kind: 'none' }], outcome: { zh: '主公愈謙,士人愈以為有德,爭來歸附。', en: 'The more the lord demurs, the more the literati deem him virtuous — and flock to serve.' } },
    ],
  },
  {
    id: 'dlg-omen-yellow-dragon',
    speaker: { zh: '地方奏報', en: 'A Provincial Report' },
    text: { zh: '有司奏:某水之濱,黃龍見焉,長數十丈,吏民聚觀。黃者,土德之色;龍者,君德之象。群下皆稱祥瑞,請以聞。', en: 'An official reports: on the banks of a certain river a yellow dragon appeared, tens of yards long, and officials and folk gathered to watch. Yellow is the hue of the Earth-virtue; the dragon, the image of the sovereign. All hail it a portent of grace and beg to record it.' },
    choices: [
      { label: { zh: '改元以應祥瑞', en: 'Change the reign-title to answer the portent' }, effects: [{ kind: 'set-flag', flag: 'omen-yellow-dragon' }], outcome: { zh: '改元詔下,遠近傳為天佑明主。', en: 'A new era is proclaimed; far and near it is told that Heaven favours the enlightened lord.' } },
      { label: { zh: '賞獻瑞者,勒石紀之', en: 'Reward the reporter, cut the wonder in stone' }, effects: [{ kind: 'gold', delta: -40 }], outcome: { zh: '立碑紀瑞,觀者如堵,皆頌盛德。', en: 'A stele records the omen; onlookers throng, all extolling the lord\'s virtue.' } },
    ],
  },
  {
    id: 'dlg-omen-qilin-phoenix',
    speaker: { zh: '苑囿之吏', en: 'A Keeper of the Parks' },
    text: { zh: '苑吏來報:鳳凰集於高梧,麒麟遊於郊藪,不畏人。古者聖王在上,則麟鳳至。此太平之象,王道之應也。', en: 'A park-keeper reports: a phoenix has settled in the tall parasol-tree, and a qilin roams the outer marsh, unafraid of men. The ancients held that when a sage rules above, qilin and phoenix come. This is the image of Great Peace, the response to kingly rule.' },
    choices: [
      { label: { zh: '布告天下,與民同慶', en: 'Proclaim it realm-wide, rejoice with the people' }, effects: [{ kind: 'gold', delta: -30 }, { kind: 'set-flag', flag: 'omen-auspice-peace' }], outcome: { zh: '普天同慶,民歌王道之盛。', en: 'The realm rejoices as one; the folk sing the glory of kingly rule.' } },
      { label: { zh: '戒左右勿以瑞自滿', en: 'Warn your court not to grow complacent on omens' }, effects: [{ kind: 'set-flag', flag: 'omen-humble-in-fortune' }], outcome: { zh: '主公曰:「瑞不足恃,惟德可久。」聞者斂容。', en: '"Omens are no ground to stand on; only virtue endures." All grow solemn.' } },
    ],
  },
  {
    id: 'dlg-omen-sweet-dew',
    speaker: { zh: '郎官', en: 'A Court Attendant' },
    text: { zh: '郎官奏:昨夜甘露降於宮樹,凝如珠玉,味甘如飴。古稱「天下和平則甘露降」,誠聖德所感也。', en: 'An attendant reports: last night sweet dew fell on the palace trees, congealed like pearls, sweet as malt-sugar. The ancients said, "when the realm is at peace, sweet dew descends" — surely the response to sagely virtue.' },
    choices: [
      { label: { zh: '集群臣於露下,賦詩紀瑞', en: 'Gather the court beneath it, compose verse to mark the wonder' }, effects: [{ kind: 'gold', delta: -20 }, { kind: 'set-flag', flag: 'omen-sweet-dew' }], outcome: { zh: '君臣賦詩,傳為一時文采風流之盛。', en: 'Lord and ministers compose together — remembered as a flowering of letters.' } },
      { label: { zh: '賜露於老病,以廣德澤', en: 'Share the dew with the aged and ailing, to spread the grace' }, effects: [{ kind: 'set-flag', flag: 'omen-dew-shared' }], outcome: { zh: '分賜孤老,民益感主公之仁。', en: 'Given to the old and orphaned; the people feel their lord\'s benevolence all the more.' } },
    ],
  },
  {
    id: 'dlg-omen-stone-script',
    speaker: { zh: '獻瑞之人', en: 'A Bringer of Portents' },
    text: { zh: '有人自山中得一異石,剖之有文,隱隱成字,似讖非讖。或雲此石應天命,主公當有非常之位。事涉圖讖,虛實難明。', en: 'A man brings a strange stone from the mountains; split open, faint markings form what seem to be words — a prophecy, or near one. Some say the stone answers the Mandate, that their lord is destined for an extraordinary throne. It touches on prophecy-lore; truth and fraud are hard to tell apart.' },
    choices: [
      { label: { zh: '納之,以為天命之符', en: 'Accept it as a token of the Mandate' }, effects: [{ kind: 'set-flag', flag: 'portent-stone-embraced' }], outcome: { zh: '圖讖流布,附者益眾,然識者頗以為妄。', en: 'The prophecy spreads and adherents multiply — though the discerning call it a fabrication.' } },
      { label: { zh: '斥圖讖惑眾,焚石不用', en: 'Denounce prophecy-mongering — burn the stone' }, effects: [{ kind: 'set-flag', flag: 'portent-stone-rejected' }], outcome: { zh: '主公惡妖妄,士林稱其明達不惑。', en: 'The lord loathes such delusion; the literati praise his clear, unclouded mind.' } },
      { label: { zh: '厚賞獻者而秘其石', en: 'Reward the bringer, but lock the stone away' }, effects: [{ kind: 'gold', delta: -30 }, { kind: 'none' }], outcome: { zh: '石藏於府,其事不彰,亦不復傳。', en: 'The stone is stored away; the matter neither shines nor spreads.' } },
    ],
  },
  {
    id: 'dlg-ballad-dongzhuo',
    speaker: { zh: '市井童謠', en: 'A Children\'s Street-Rhyme' },
    text: { zh: '市井忽傳一謠:「千里草,何青青;十日卜,不得生。」童子連臂而歌,不知所自。識者驚曰:此隱「董卓」二字,乃亡卓之讖也!', en: 'A rhyme sweeps the streets: "Thousand-league grass, how green, how green; ten-day divined, it shall not live." Children sing it arm in arm, none knows whence. The learned start: hidden in it is the name "Dong Zhuo" — a prophecy of his fall!' },
    choices: [
      { label: { zh: '默察其應,靜待其變', en: 'Watch quietly for its fulfilment' }, effects: [{ kind: 'set-flag', flag: 'ballad-dongzhuo-heard' }], outcome: { zh: '主公密識之,以觀天下之變。', en: 'The lord marks it in secret, watching how the realm will turn.' } },
      { label: { zh: '嘆天意假童口而洩', en: 'Marvel that Heaven leaks its will through children\'s mouths' }, effects: [{ kind: 'none' }], outcome: { zh: '主公喟然:「人心即天心,謠讖非無因也。」', en: '"The heart of the people is the heart of Heaven; such rhymes are not without cause."' } },
    ],
    conditions: { minYear: 189, maxYear: 193 },
  },
  {
    id: 'dlg-ballad-beimang',
    speaker: { zh: '洛下童謠', en: 'A Rhyme of the Capital' },
    text: { zh: '洛陽童謠曰:「帝非帝,王非王,千乘萬騎上北邙。」語涉乘輿播越、社稷傾危,聞者股栗。京師人情洶洶,若大亂之將至。', en: 'A rhyme of Luoyang runs: "Emperor no emperor, king no king; a thousand chariots, ten thousand horse, up to Beimang they ring." It speaks of the throne cast adrift and the altars in peril; hearers tremble. The capital seethes as if great chaos nears.' },
    choices: [
      { label: { zh: '勒兵自守,以備非常', en: 'Marshal troops to guard against upheaval' }, effects: [{ kind: 'gold', delta: -40 }, { kind: 'set-flag', flag: 'ballad-beimang-braced' }], outcome: { zh: '嚴兵以待,亂起而我獨全。', en: 'Troops stand ready; when chaos breaks, you alone are whole.' } },
      { label: { zh: '遣使問安,窺伺京師之變', en: 'Send envoys to pay respects — and spy the capital\'s turmoil' }, effects: [{ kind: 'set-flag', flag: 'ballad-beimang-watched' }], outcome: { zh: '使者往還,京師虛實盡入掌握。', en: 'Envoys come and go; the capital\'s strength and weakness fall into your grasp.' } },
    ],
    conditions: { minYear: 188, maxYear: 191 },
  },
  {
    id: 'dlg-prophecy-dangtu',
    speaker: { zh: '方士', en: 'An Occultist' },
    text: { zh: '一方士進讖曰:「代漢者,當塗高也。」附耳而言:塗者路也,當塗而高者,闕也——魏之象也。此漢祚將終、代興有人之兆,願明公深察。', en: 'An occultist offers a prophecy: "He who succeeds the Han is the one high upon the road." Leaning close, he glosses it: the "road" is a path, and what stands high beside the road is a watchtower — a gate-tower, the image of Wei. It signals the Han\'s ending and a successor\'s rise. Weigh it deeply, my lord.' },
    choices: [
      { label: { zh: '若合於己,則以自壯', en: 'If it fits you, take heart from it' }, effects: [{ kind: 'set-flag', flag: 'prophecy-dangtu-claimed' }], outcome: { zh: '主公引以自負,左右鹹謂天命有歸。', en: 'The lord takes it to himself; his court agrees the Mandate has found its home.' } },
      { label: { zh: '斥讖緯為妄,不足為據', en: 'Dismiss prophecy-lore as delusion, no ground to stand on' }, effects: [{ kind: 'none' }], outcome: { zh: '主公曰:「天命在德不在讖。」士人韙之。', en: '"The Mandate rests in virtue, not in prophecy." The literati approve.' } },
      { label: { zh: '厚遣方士,勿使惑眾', en: 'Send the occultist off with gifts — lest he stir the crowds' }, effects: [{ kind: 'gold', delta: -30 }, { kind: 'set-flag', flag: 'prophecy-dangtu-hushed' }], outcome: { zh: '方士得賞而去,讖語不復張揚。', en: 'Rewarded, the occultist departs; the prophecy is voiced no more.' } },
    ],
    conditions: { minYear: 200 },
  },

  // ─── 2026-07 補:異族風俗(邊塞諸族的羈縻・征討・互市・以夷制夷)───
  // 南蠻/羌/烏桓/鮮卑/山越/氐/匈奴/東夷各具其俗,對之或撫或討或用其銳。
  // 接 tribes.ts 諸族;兩則以 recruit 收異族猛將(requiresOfficerActive 錨定其尚存)。
  {
    id: 'dlg-tribe-nanman-envoy',
    speakerOfficerId: 'meng-huo',
    speaker: { zh: '南蠻使者', en: 'A Nanman Envoy' },
    text: { zh: '南中蠻王遣使,獻犀甲、象牙、丹漆:「我王身被犀甲,坐驅猛獸,聚眾數萬。漢家若以兵相加,山林瘴癘,未見其利。不若通好互市,各安其境。」', en: 'The Man king of the south sends gifts — rhino-hide armour, ivory, cinnabar-lacquer: "My king wears rhino-hide, drives wild beasts to battle, and musters tens of thousands. Should the Han bring arms, the jungle\'s miasma promises no gain. Better to trade in peace, each secure in his own land."' },
    choices: [
      { label: { zh: '攻心為上,以德懷之', en: 'Win the heart first — draw them with virtue' }, effects: [{ kind: 'set-flag', flag: 'nanman-hearts-and-minds' }], outcome: { zh: '厚遣其使,示以恩信,南人稍有向化之意。', en: 'The envoy is sent back laden with kindness; the southern folk warm, a little, toward you.' } },
      { label: { zh: '開關互市,通有無', en: 'Open the passes to trade' }, effects: [{ kind: 'gold', delta: 50 }], outcome: { zh: '蜀錦易犀象,關市之利兩得其便。', en: 'Shu-brocade for rhino and ivory — the border market profits both sides.' } },
      { label: { zh: '陳兵示威,責其入貢', en: 'Show force, demand tribute' }, effects: [{ kind: 'gold', delta: 30 }, { kind: 'set-flag', flag: 'nanman-cowed' }], outcome: { zh: '蠻使懾服納貢,然山寨之間,怨言已生。', en: 'The envoy submits and pays — yet among the hill-forts, grievance stirs.' } },
    ],
  },
  {
    id: 'dlg-tribe-nanman-submit',
    speakerOfficerId: 'meng-huo',
    speaker: { zh: '南蠻之王', en: 'The King of the Nanman' },
    text: { zh: '蠻王歷經擒縱,終釋兵頓首:「公,天威也,南人不復反矣!某願率洞主部曲,世為漢家藩籬,永不背叛。」左右皆疑其詐,亦或真心。', en: 'Captured and freed time upon time, the Man king lays down his arms and bows his head at last: "My lord — this is Heaven\'s might; the southern folk will rebel no more! I would lead my cave-chiefs and clansmen to be the Han\'s frontier hedge, forever loyal." Some suspect a ruse; some, true surrender.' },
    choices: [
      { label: { zh: '納其降,收南人之心', en: 'Accept the surrender — win the southern hearts' }, effects: [{ kind: 'recruit', officerId: 'meng-huo' }, { kind: 'set-flag', flag: 'nanman-pacified' }], outcome: { zh: '孟獲率眾內附,南中自此不設漢官而自安,兵資皆給。', en: 'Meng Huo brings his people in; thereafter the south holds itself at peace, and yields troops and stores.' } },
      { label: { zh: '受降而留質,以防其變', en: 'Accept, but hold a hostage against betrayal' }, effects: [{ kind: 'gold', delta: -30 }, { kind: 'set-flag', flag: 'nanman-hostage' }], outcome: { zh: '納質羈縻,南中粗定,然蠻王心終未盡安。', en: 'A hostage taken and the south loosely bound; it settles — though the Man king\'s heart is never wholly eased.' } },
    ],
    conditions: { requiresOfficerActive: 'meng-huo' },
  },
  {
    id: 'dlg-tribe-qiang-restive',
    speaker: { zh: '涼州邊吏', en: 'A Liangzhou Border Officer' },
    text: { zh: '邊吏急報:燒當、參狼諸羌種落,叛服無常。羌人尚勇力,重血親復仇,一人有怨,舉種相鬥。今守將貪暴,羌怨已深,恐復為邊患。', en: 'A border officer reports in haste: the Shaodang and Canlang Qiang tribes turn loyal and rebel by whim. The Qiang prize strength and honour blood-vengeance — one man\'s grievance sets a whole tribe to war. The garrison chief is greedy and cruel; Qiang resentment runs deep, and the frontier may burn again."' },
    choices: [
      { label: { zh: '罷貪吏,厚撫羈縻', en: 'Dismiss the corrupt officer, soothe and bind them' }, effects: [{ kind: 'gold', delta: -50 }, { kind: 'set-flag', flag: 'qiang-appeased' }], outcome: { zh: '易良吏、除苛政,羌人感悅,邊境粗安。', en: 'A better officer, the harsh levies lifted — the Qiang are moved, and the frontier quiets.' } },
      { label: { zh: '徙其種落於內地,分而弱之', en: 'Resettle the tribes inland, divide and weaken them' }, effects: [{ kind: 'set-flag', flag: 'qiang-resettled' }], outcome: { zh: '徙羌實邊,勢雖分而怨益積,埋亂之種。', en: 'The Qiang are moved to fill the marches; their strength splits, but grievance banks up — seeds of revolt.' } },
      { label: { zh: '發兵征討,以威定之', en: 'March out to crush them by force' }, effects: [{ kind: 'gold', delta: -40 }, { kind: 'set-flag', flag: 'qiang-campaign' }], outcome: { zh: '兵鋒所至,羌暫遁入山,然野火燒不盡,春風吹又生。', en: 'The Qiang flee to the hills before your spears — yet wildfire never wholly dies; spring wind revives it.' } },
    ],
  },
  {
    id: 'dlg-tribe-wuhuan-cavalry',
    speaker: { zh: '幽州從事', en: 'A Youzhou Adjutant' },
    text: { zh: '幽州從事進言:「烏桓突騎,天下名騎也,控弦數萬,蹋頓最雄。若能收其銳為我所用,則北疆之兵甲於中國;若縱之南牧,則邊郡無寧日。」', en: 'A Youzhou adjutant advises: "The Wuhuan shock-cavalry are the finest horse under Heaven — tens of thousands of bows, and Tadun the mightiest. Win their edge to your use, and the northern host will lead the realm; loose them to raid south, and the border knows no peace."' },
    choices: [
      { label: { zh: '厚結其大人,收突騎為用', en: 'Court their chiefs, take the shock-horse into service' }, effects: [{ kind: 'gold', delta: -60 }, { kind: 'set-flag', flag: 'wuhuan-cavalry-won' }], outcome: { zh: '烏桓突騎歸麾,北兵稱雄,敵騎為之奪氣。', en: 'The Wuhuan horse come under your banner; your northern arm reigns, and rival cavalry lose their nerve.' } },
      { label: { zh: '出塞掩襲,效白狼山故事', en: 'Strike beyond the passes — the White Wolf Mountain gambit' }, effects: [{ kind: 'gold', delta: -50 }, { kind: 'set-flag', flag: 'wuhuan-broken' }], outcome: { zh: '輕騎卒至,臨陣斬其單于,烏桓遂衰,降者二十餘萬。', en: 'Light horse fall on them by surprise; their khan is cut down mid-field, the Wuhuan broken, and two hundred thousand submit.' } },
    ],
  },
  {
    id: 'dlg-tribe-xianbei-khan',
    speaker: { zh: '護烏桓校尉', en: 'The Protector-Colonel' },
    text: { zh: '校尉奏:鮮卑控弦十萬,分東、中、西三部,大人各擁強兵。昔檀石槐盡有匈奴故地,今軻比能復欲併諸部而一之。此虜若合,則塞下危矣。', en: 'The colonel reports: the Xianbei field a hundred thousand bows in three divisions — east, centre, west — each chief with a strong host. Once Tanshihuai held all the old Xiongnu lands; now Kebineng seeks to fuse the divisions into one. Should these barbarians unite, the marches are in peril."' },
    choices: [
      { label: { zh: '離間諸部,勿使其合', en: 'Sow division among the chiefs — keep them apart' }, effects: [{ kind: 'gold', delta: -40 }, { kind: 'set-flag', flag: 'xianbei-divided' }], outcome: { zh: '賂結諸大人,使相猜貳,鮮卑終不能一。', en: 'Bribes and pacts set the chiefs at odds; the Xianbei never quite become one.' } },
      { label: { zh: '通關和市,羈縻懷柔', en: 'Open the border market, bind them with goodwill' }, effects: [{ kind: 'gold', delta: 40 }], outcome: { zh: '和市既通,虜得繒帛,暫緩其鋒,邊亦獲利。', en: 'With the market open the barbarians gain silk; their edge dulls awhile, and the border profits too.' } },
      { label: { zh: '築塞列亭,嚴為之備', en: 'Raise forts and beacon-posts, guard hard' }, effects: [{ kind: 'gold', delta: -50 }, { kind: 'set-flag', flag: 'xianbei-walled-out' }], outcome: { zh: '烽燧相望,虜至無所掠而還,邊民得耕。', en: 'Beacon to beacon in sight; raiders come, find nothing, and turn back — the border folk may till.' } },
    ],
  },
  {
    id: 'dlg-tribe-shanyue-hills',
    speaker: { zh: '江東將領', en: 'A Southland Commander' },
    text: { zh: '將領請命:「山越阻險不賓,依阻山林,出為寇盜、入為民,強宗驍帥擁眾自守。若討而定之,可得精兵——出山之越,悍勇冠於諸軍;然用兵艱難,曠日持久。」', en: 'A commander asks leave: "The Shan Yue hold the crags unbowed — sheltering in the wooded heights, raiders abroad and farmers at home, their strong clans and bold chiefs standing apart. Subdue them and you gain crack troops: Yue who come down from the hills outmatch any in valour — though the fighting is hard and long."' },
    choices: [
      { label: { zh: '討定山越,強者為兵、弱者補戶', en: 'Subdue them — the strong to arms, the rest to the rolls' }, effects: [{ kind: 'gold', delta: -50 }, { kind: 'set-flag', flag: 'shanyue-pacified' }], outcome: { zh: '越人出山,得勁卒數萬,江東之兵益強。', en: 'The Yue come down; tens of thousands of hardened soldiers swell the Southland\'s ranks.' } },
      { label: { zh: '羈縻其帥,通市易鹽鐵', en: 'Bind their chiefs, trade salt and iron' }, effects: [{ kind: 'gold', delta: 30 }], outcome: { zh: '不勞師而通貨,山越暫安,亦有出而附者。', en: 'Trade without a campaign; the Yue quiet awhile, and some come down to join.' } },
    ],
  },
  {
    id: 'dlg-tribe-di-frontier',
    speaker: { zh: '雍州刺史', en: 'The Yongzhou Inspector' },
    text: { zh: '刺史議:武都、陰平之氐,半耕半牧,散居山谷,種落繁多。氐人怯於野戰而長於守險,若善撫之,可為屏藩;若逼之過急,則據險為亂。', en: 'The inspector deliberates: the Di of Wudu and Yinping half-till, half-herd, scattered through the valleys in many tribes. The Di are timid in open battle but stubborn behind cliffs; treat them well and they screen your border — press them too hard and they hold the heights in revolt."' },
    choices: [
      { label: { zh: '撫而用之,使為西邊屏藩', en: 'Win them over as a western screen' }, effects: [{ kind: 'set-flag', flag: 'di-buffer' }], outcome: { zh: '氐帥受爵,守險為我藩籬,西陲賴以粗安。', en: 'The Di chiefs take rank and hold the passes as your hedge; the western march rests easier.' } },
      { label: { zh: '徙氐實關中,以充戶口', en: 'Resettle the Di into Guanzhong to fill the rolls' }, effects: [{ kind: 'gold', delta: 20 }, { kind: 'set-flag', flag: 'di-resettled' }], outcome: { zh: '徙氐數萬實關中,倉廩戶口俱增,然雜處之患,亦伏於此。', en: 'Tens of thousands of Di fill Guanzhong; granaries and households grow — though the trouble of mixed peoples is planted here too.' } },
    ],
  },
  {
    id: 'dlg-tribe-xiongnu-parts',
    speaker: { zh: '并州別駕', en: 'A Bingzhou Aide' },
    text: { zh: '別駕陳策:南匈奴內附,居於并州,單于呼廚泉,左賢王劉豹,眾且十萬。單于久居京師為質,其國分為五部,各立部帥,而以漢人監之——此馭虜之上策也。', en: 'An aide sets out a plan: the Southern Xiongnu have submitted and dwell in Bingzhou — the Chanyu Huchuquan, the Worthy King of the Left Liu Bao, near a hundred thousand strong. Keep the Chanyu long in the capital as hostage, split the nation into five divisions each under its own commander, and set Han overseers upon them — this is the master-stratagem for handling barbarians."' },
    choices: [
      { label: { zh: '分五部,立帥而監之', en: 'Split them into five, appoint commanders and overseers' }, effects: [{ kind: 'set-flag', flag: 'xiongnu-five-parts' }], outcome: { zh: '匈奴分而勢弱,終漢世不能為大患。', en: 'Divided, the Xiongnu weaken; through the age they never grow into a great menace.' } },
      { label: { zh: '和親賜繒,以安其眾', en: 'Wed and gift them silk to settle the horde' }, effects: [{ kind: 'gold', delta: -60 }, { kind: 'set-flag', flag: 'xiongnu-heqin' }], outcome: { zh: '和親既定,單于納款,北邊暫得寧息。', en: 'The marriage sealed and the Chanyu appeased, the northern border wins a spell of rest.' } },
      { label: { zh: '出金贖歸沒胡之漢女', en: 'Pay gold to ransom home the Han women taken by the Hu' }, effects: [{ kind: 'gold', delta: -80 }, { kind: 'set-flag', flag: 'xiongnu-ransom' }], outcome: { zh: '重金贖歸文姬之屬,士林感泣,傳為仁德。', en: 'At heavy cost you ransom home the likes of Lady Cai; the literati weep, and call it benevolence.' } },
    ],
  },
  {
    id: 'dlg-tribe-dongyi-envoy',
    speaker: { zh: '東夷使者', en: 'An Eastern Envoy' },
    text: { zh: '玄菟之外,高句麗、扶餘遣使來朝,獻貂皮、良弓、果下馬。二國介居遼東之東,時通時叛。使者言辭恭順,然邊將密報:高句麗數寇遼東,恐非誠服。', en: 'From beyond Xuantu, Goguryeo and Buyeo send envoys to court, bearing sable pelts, fine bows, and dwarf horses. The two states lie east of Liaodong, now friendly, now in revolt. The envoys\' words are humble — yet a border general warns in secret: Goguryeo has raided Liaodong more than once; this may be no true submission."' },
    choices: [
      { label: { zh: '納貢通好,厚賜其使', en: 'Accept the tribute, reward the envoys richly' }, effects: [{ kind: 'gold', delta: -30 }, { kind: 'set-flag', flag: 'dongyi-friendly' }], outcome: { zh: '東夷歲貢貂馬,遼東之市頗獲其利。', en: 'The eastern peoples render sable and horses yearly; the Liaodong market profits well.' } },
      { label: { zh: '陳兵遼東,以備其詐', en: 'Mass troops in Liaodong against their treachery' }, effects: [{ kind: 'gold', delta: -40 }, { kind: 'set-flag', flag: 'dongyi-guarded' }], outcome: { zh: '嚴兵設備,高句麗不敢輕動,邊塞肅然。', en: 'With troops arrayed and ready, Goguryeo dares not stir; the frontier stands stern.' } },
    ],
  },
  {
    id: 'dlg-tribe-wuxi-shamoke',
    speakerOfficerId: 'shamoke',
    speaker: { zh: '五溪蠻王', en: 'The King of the Five Streams' },
    text: { zh: '五溪蠻王沙摩柯,滿臉虯髯,腰懸鐵蒺藜骨朵,昂然來見:「聞公起兵討賊,某素慕漢家恩信。願率五溪之眾,為公前驅,萬死不辭!」', en: 'Shamoke, King of the Five Streams — bristling-bearded, an iron mace at his waist — strides in proudly: "I hear you raise arms against the traitors, and I have long honoured the Han\'s good faith. Let me lead the men of the Five Streams as your vanguard — I\'ll not shrink from ten thousand deaths!"' },
    choices: [
      { label: { zh: '納其誠,收五溪之眾為前部', en: 'Take his faith — make the Five Streams your van' }, effects: [{ kind: 'recruit', officerId: 'shamoke' }, { kind: 'set-flag', flag: 'wuxi-allied' }], outcome: { zh: '沙摩柯率蠻兵來歸,山地之戰,悍不畏死,敵為之膽寒。', en: 'Shamoke brings his Man warriors over; in the hill-fighting they scorn death, and the foe\'s courage fails.' } },
      { label: { zh: '厚賜結盟,而不使深入', en: 'Reward and ally — but keep them at arm\'s length' }, effects: [{ kind: 'gold', delta: -50 }, { kind: 'set-flag', flag: 'wuxi-ally-loose' }], outcome: { zh: '結為外援,蠻王雖悅,然終隔一層。', en: 'Bound as an outer ally, the Man king is pleased — yet a distance remains.' } },
    ],
    conditions: { requiresOfficerActive: 'shamoke' },
  },

  // ─── 2026-07 補:檄文・表文・書信(漢季文章即政治,呈文待決)───
  // 三國以文采名世 —— 一紙檄可奪人氣、一篇表可明心跡、一封書可定去就。
  // 各為「幕僚/作者呈文,由你裁決是否頒行/採納」;史實有據者以 minYear 錨定。
  {
    id: 'dlg-doc-denounce-xi',
    speaker: { zh: '記室主簿', en: 'The Chief Secretary' },
    text: { zh: '主簿捧一檄文入奏:「某為明公草討賊之檄,歷數其罪,辭極峻切,可傳檄州郡,使天下知曲直所在。檄曰:『其罪貫盈,人神共憤,興義兵以誅暴亂……』」', en: 'The secretary presents a proclamation: "I have drafted your war-manifesto, my lord — every crime of the traitor set forth in the sharpest words. Circulate it to the provinces, that the realm may know where right lies. It reads: \'His crimes brim over, gods and men alike enraged; we raise a righteous host to smite the tyrant...\'"' },
    choices: [
      { label: { zh: '傳檄天下,壯我聲勢', en: 'Circulate it — swell our momentum' }, effects: [{ kind: 'set-flag', flag: 'proclaimed-denunciation' }], outcome: { zh: '檄文所至,州郡震動,響應者眾,敵為之奪氣。', en: 'Where the manifesto reaches, provinces stir and many answer; the foe\'s spirit sinks.' } },
      { label: { zh: '削其峻辭,務存忠厚', en: 'Blunt its harshest words — keep it magnanimous' }, effects: [{ kind: 'set-flag', flag: 'proclamation-tempered' }], outcome: { zh: '檄辭雖緩,而識者益服明公之有度。', en: 'Softer in tone — yet the discerning admire your measure all the more.' } },
      { label: { zh: '兵未動而檄先發,非計也', en: 'To proclaim before the army moves is folly — hold it' }, effects: [{ kind: 'none' }], outcome: { zh: '藏檄不發,俟時而動,敵不知我所圖。', en: 'The manifesto is withheld to await the hour; the foe cannot read your design.' } },
    ],
    conditions: { minYear: 190 },
  },
  {
    id: 'dlg-doc-seek-talent',
    speaker: { zh: '幕府長史', en: 'The Chancellery Chief' },
    text: { zh: '長史進言:「今天下未定,正求賢之急時。或謂『士有偏短,不可廢也』——若必廉士而後可用,則齊桓其何以霸世?請下令:唯才是舉,吾得而用之。」', en: 'The chancellery chief advises: "The realm is unsettled — the very hour to hunt for talent. Some men have flaws, yet must not be cast aside; if only the spotless could serve, how would Duke Huan of Qi have won his primacy? Let the order go out: promote by talent alone, and I shall find and use them."' },
    choices: [
      { label: { zh: '下令唯才是舉', en: 'Decree: promote by talent alone' }, effects: [{ kind: 'gold', delta: -30 }, { kind: 'set-flag', flag: 'edict-talent-only' }], outcome: { zh: '令出,四方之士,負販屠沽,有一藝者爭來歸,幕府為之充。', en: 'The order goes out; men of every station with a single gift come flocking, and the chancellery fills.' } },
      { label: { zh: '才德並重,不廢行檢', en: 'Weigh talent and virtue both — do not drop character' }, effects: [{ kind: 'set-flag', flag: 'edict-talent-and-virtue' }], outcome: { zh: '兼取才行,雖失狂狷之士,而朝多端方之人。', en: 'Talent and conduct together — a few wild geniuses slip past, but the court fills with upright men.' } },
    ],
    conditions: { minYear: 200 },
  },
  {
    id: 'dlg-doc-northern-memorial',
    speaker: { zh: '丞相', en: 'The Chancellor' },
    text: { zh: '丞相夜草一表,泣而奏曰:「臣本布衣,躬耕於南野,先帝三顧,託臣以討賊興復之任。今南方已定,兵甲已足,當獎率三軍,北定中原……臣鞠躬盡瘁,死而後已!」', en: 'By night the Chancellor drafts a memorial and presents it in tears: "Your servant was a commoner, tilling the southern fields, until the late sovereign called on me thrice and charged me to smite the traitors and restore the house. The south is pacified, the arms are ready — now I would lead the three armies to settle the heartland... I will bend to the task and give my all, till death and no sooner."' },
    choices: [
      { label: { zh: '允其出師,託以專征', en: 'Grant the campaign — entrust him full command' }, effects: [{ kind: 'set-flag', flag: 'northern-expedition-sanctioned' }], outcome: { zh: '詔許出師,丞相拜表而行,舉國屬望。', en: 'The campaign is sanctioned; the Chancellor bows over his memorial and marches, the whole realm\'s hope upon him.' } },
      { label: { zh: '慮國力未充,乞其緩圖', en: 'Fear the realm too weak — beg him to wait' }, effects: [{ kind: 'gold', delta: 40 }, { kind: 'set-flag', flag: 'northern-expedition-deferred' }], outcome: { zh: '丞相含淚受命,退而益務農桑、講武訓卒。', en: 'The Chancellor takes the word in tears, and turns instead to husbandry and the drilling of troops.' } },
    ],
    conditions: { minYear: 226 },
  },
  {
    id: 'dlg-doc-urge-throne',
    speaker: { zh: '群臣', en: 'The Assembled Ministers' },
    text: { zh: '群臣連署上勸進表:「今漢祚衰微,天命有歸,明公功蓋寰宇,德被生民,四海鹹思推戴。願上應天命,下順民心,早正大位,以繫天下之望!」', en: 'The ministers submit a joint memorial urging you to the throne: "The Han\'s fortune wanes and the Mandate has found its home. Your merit shadows the world, your virtue clothes the people, and all within the seas long to raise you up. Answer Heaven above and the people below — take the great seat, and anchor the realm\'s hope!"' },
    choices: [
      { label: { zh: '三辭三讓,以合古禮', en: 'Thrice decline, thrice yield — as ancient rite demands' }, effects: [{ kind: 'set-flag', flag: 'throne-thrice-declined' }], outcome: { zh: '再三謙讓而後受,群臣愈以為謙德,天下無間言。', en: 'You decline again and again before accepting; the ministers deem it humble virtue, and none in the realm objects.' } },
      { label: { zh: '受之,以繫人望', en: 'Accept — to hold the people\'s hope' }, effects: [{ kind: 'set-flag', flag: 'throne-accepted' }], outcome: { zh: '受群臣之請,正位號令,人心翕然而定。', en: 'You accept their plea and take the seat; hearts settle as one.' } },
      { label: { zh: '斥其非時,天下未一', en: 'Rebuke them — the hour is wrong, the realm not yet one' }, effects: [{ kind: 'set-flag', flag: 'throne-refused-untimely' }], outcome: { zh: '主公曰:「天下未定,遽正位號,是速謗也。」士林韙其明。', en: '"To take the title before the realm is settled only courts reproach." The literati praise his clarity.' } },
    ],
    conditions: { minYear: 210 },
  },
  {
    id: 'dlg-doc-self-vindication',
    speaker: { zh: '主公自述', en: 'The Lord\'s Own Words' },
    text: { zh: '外間頗有謗議,謂主公懷不臣之心。主公乃作一令自明本志:「設使國家無有孤,不知當幾人稱帝,幾人稱王……然欲孤釋兵權,誠恐一旦解職,為人所禍也。」左右問:當頒之否?', en: 'Slander spreads that the lord harbours designs on the throne. He composes an edict to declare his true intent: "Were it not for me, who knows how many would style themselves emperor, how many king?... Yet to lay down my command — I fear that once disarmed, I should fall to another\'s malice." His aides ask: shall it be published?' },
    choices: [
      { label: { zh: '頒令自明,以釋群疑', en: 'Publish it — to dispel the doubts' }, effects: [{ kind: 'set-flag', flag: 'edict-self-vindication' }], outcome: { zh: '令出,誠意剖白,謗者稍息,而知者益測其深。', en: 'The edict lays the heart bare; slander quiets — though the shrewd probe deeper still.' } },
      { label: { zh: '身正不畏影斜,置之不辯', en: 'A straight body fears no crooked shadow — leave it unanswered' }, effects: [{ kind: 'none' }], outcome: { zh: '不辯而謗自止者半,疑者自疑,主公坦然。', en: 'Half the slander dies unanswered; the doubters go on doubting, and the lord is untroubled.' } },
    ],
    conditions: { minYear: 205 },
  },
  {
    id: 'dlg-doc-admonish-son',
    speaker: { zh: '主公家書', en: 'A Family Letter' },
    text: { zh: '主公燈下作書誡子弟,反覆斟酌其辭:「夫君子之行,靜以修身,儉以養德。非淡泊無以明志,非寧靜無以致遠……年與時馳,意與日去,遂成枯落,悲守窮廬,將復何及!」', en: 'By lamplight the lord writes to admonish his sons, weighing each phrase: "The conduct of a gentleman: stillness to cultivate the self, thrift to nourish virtue. Without detachment there is no clarity of purpose; without serenity, no reaching afar... The years race with the seasons, the will ebbs with the days — and one withers at last, grieving in a bare hut. What use is it then?"' },
    choices: [
      { label: { zh: '手書付子弟,誡以立身', en: 'Send it to the sons, charge them how to stand in the world' }, effects: [{ kind: 'set-flag', flag: 'letter-admonish-heir' }], outcome: { zh: '子弟拜書而藏之,家法謹嚴,後多成材。', en: 'The sons receive the letter and keep it close; the family discipline is strict, and many come to worth.' } },
      { label: { zh: '別附田宅之產以安其後', en: 'Enclose land and estate to secure their future' }, effects: [{ kind: 'gold', delta: -50 }, { kind: 'set-flag', flag: 'letter-with-legacy' }], outcome: { zh: '既誡之以德,復厚之以產,子弟感而知勉。', en: 'Charged in virtue and endowed besides, the sons are moved to diligence.' } },
    ],
  },
  {
    id: 'dlg-doc-surrender-table',
    speaker: { zh: '敵國使者', en: 'An Envoy of the Foe' },
    text: { zh: '敵國勢窮,遣使奉降表來:「臣某昧死上言:天兵所臨,如泰山壓卵。臣自知罪重,願舉城歸命,奉土地、獻圖籍,惟乞保全宗族性命。」使者伏地待命。', en: 'His cause spent, the enemy sends an envoy bearing a memorial of surrender: "Your servant, risking death, submits: your heavenly host bears down as Mount Tai upon an egg. Knowing my guilt is grave, I would yield my city, hand over its lands and its registers, and beg only that my clan\'s lives be spared." The envoy lies prostrate, awaiting your word.' },
    choices: [
      { label: { zh: '納其降,示以寬大', en: 'Accept the surrender — show magnanimity' }, effects: [{ kind: 'gold', delta: 60 }, { kind: 'set-flag', flag: 'surrender-accepted-mercy' }], outcome: { zh: '受降不戮,遠近聞之,望風款附者相繼。', en: 'Surrender taken without slaughter; hearing of it, far and near come over unbidden.' } },
      { label: { zh: '責其反覆,納降而奪其權', en: 'Rebuke his fickleness — accept, but strip his power' }, effects: [{ kind: 'gold', delta: 40 }, { kind: 'set-flag', flag: 'surrender-accepted-defanged' }], outcome: { zh: '受其降而削其兵,雖得其地,亦失其心。', en: 'The surrender taken and his troops cut away; you gain the ground, but not the heart.' } },
    ],
  },
  {
    id: 'dlg-doc-rally-loyalists',
    speaker: { zh: '義士', en: 'A Loyalist' },
    text: { zh: '一義士齎血書夜至:「國賊挾天子以令諸侯,王室危如累卵!某齎密詔,遍告忠義,願明公倡義移檄,糾合州郡,共扶漢室,誅此國賊!」', en: 'A loyalist arrives by night with a blood-written appeal: "The traitor holds the Son of Heaven hostage to command the lords; the royal house teeters like stacked eggs! I bear a secret edict to rally the loyal and just. Raise the righteous cause, my lord — send round the call, gather the provinces, and together prop up the Han and slay this traitor!"' },
    choices: [
      { label: { zh: '移檄州郡,倡義勤王', en: 'Send the call round — raise the cause, succour the throne' }, effects: [{ kind: 'gold', delta: -40 }, { kind: 'set-flag', flag: 'loyalist-banner-raised' }], outcome: { zh: '檄告四方,忠義響應,勤王之師漸集。', en: 'The call goes to every quarter; the loyal answer, and a host to save the throne begins to gather.' } },
      { label: { zh: '受詔而未敢輕動,徐圖之', en: 'Take the edict, but move with care — bide the time' }, effects: [{ kind: 'set-flag', flag: 'loyalist-edict-held' }], outcome: { zh: '藏詔待時,不欲以孤軍犯難,識者以為持重。', en: 'The edict kept and the hour awaited — unwilling to risk a lone army; the wise call it prudence.' } },
    ],
  },
  {
    id: 'dlg-doc-deathbed-memorial',
    speaker: { zh: '老臣', en: 'An Aged Minister' },
    text: { zh: '一老臣病篤,強起草遺表,字字血誠:「臣家有桑八百株,薄田十五頃,子孫衣食自有餘饒。臣死之日,不使內有餘帛,外有贏財,以負陛下……」聞者無不流涕。', en: 'An aged minister, gravely ill, forces himself up to draft a final memorial, every word wrung from the heart: "Your servant\'s house holds eight hundred mulberry trees and fifteen qing of poor land — enough and to spare for my heirs\' food and clothing. On the day I die, let there be no surplus silk within, no hoarded wealth without, that I not fail Your Majesty..." None who hear can keep from tears.' },
    choices: [
      { label: { zh: '厚恤其家,以旌清節', en: 'Provide richly for his house — to honour his pure integrity' }, effects: [{ kind: 'gold', delta: -60 }, { kind: 'set-flag', flag: 'minister-honored-death' }], outcome: { zh: '優詔褒恤,天下聞之,皆以廉直相勉。', en: 'A gracious edict of honour and relief; hearing of it, the realm spurs itself to honesty.' } },
      { label: { zh: '如其遺言,不加厚葬', en: 'Honour his wish — no lavish burial' }, effects: [{ kind: 'set-flag', flag: 'minister-frugal-rites' }], outcome: { zh: '從其薄葬之志,士論益高其風。', en: 'His wish for a frugal burial is kept; opinion esteems his character all the higher.' } },
    ],
  },
  {
    id: 'dlg-doc-remonstrance',
    speaker: { zh: '諫臣', en: 'A Remonstrating Minister' },
    text: { zh: '一諫臣抗疏切諫:「臣聞良藥苦口利於病,忠言逆耳利於行。近者土木頻興,賦役日重,民有菜色而府藏虛。願陛下罷不急之役,輕徭薄賦,以固邦本。臣冒死以聞!」', en: 'A minister submits a blunt remonstrance: "I have heard that bitter medicine cures the illness, and unwelcome counsel mends the conduct. Of late the building never ceases and the levies grow by the day; the people wear the pallor of famine while the treasury lies empty. Halt the needless works, lighten the corvée and the taxes, and make firm the root of the state. I risk death to say it!"' },
    choices: [
      { label: { zh: '納諫罷役,輕徭薄賦', en: 'Heed him — halt the works, lighten the burdens' }, effects: [{ kind: 'set-flag', flag: 'remonstrance-heeded' }], outcome: { zh: '詔罷諸役,民力少蘇,諫臣拜謝,朝野稱明。', en: 'The works are halted by edict; the people\'s strength revives a little. The minister bows in thanks, and all praise your wisdom.' } },
      { label: { zh: '嘉其直,賜金而未盡從', en: 'Praise his candour, reward him gold — but do not fully act' }, effects: [{ kind: 'gold', delta: -30 }, { kind: 'none' }], outcome: { zh: '優容直臣而工役未罷,諫者退而長歎。', en: 'The blunt minister is indulged, yet the works go on; he withdraws with a long sigh.' } },
      { label: { zh: '怒其訕上,黜之', en: 'Bristle at the affront — demote him' }, effects: [{ kind: 'set-flag', flag: 'remonstrance-punished' }], outcome: { zh: '黜直臣,自是諫路漸塞,左右唯唯而已。', en: 'The honest minister is cast down; thereafter the road of counsel narrows, and aides only murmur assent.' } },
    ],
  },
];

/** Lookup by id for branching follow-ups. */
export const DIALOGUE_EVENTS_BY_ID: Record<string, DialogueEvent> =
  Object.fromEntries(DIALOGUE_EVENTS.map((d) => [d.id, d]));
