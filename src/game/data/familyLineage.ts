import type { FamilyRelation } from '../types/family';

/**
 * Historical family lineages — populated into `state.family` at scenario
 * load so famous Three Kingdoms officers start with their canonical
 * father/mother/son/spouse/sibling relations already in place.
 *
 * Format:
 *   - parent-child: officerA is the PARENT, officerB is the CHILD
 *   - spouse: order doesn't matter
 *   - sibling: order doesn't matter
 *
 * Only relations where BOTH officers exist in the playable roster are
 * eventually applied (filtered at load time).
 */
export const FAMILY_LINEAGE: FamilyRelation[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 三曹 / 曹氏 (House of Cao)
  // ═══════════════════════════════════════════════════════════════════
  // Cao Cao + his sons (Cao Pi, Cao Zhang, Cao Zhi, Cao Xiong, Cao Ang, Cao Chong, Cao Yu, Cao Gun, Cao Lin)
  { officerA: 'cao-cao',    officerB: 'cao-pi',     kind: 'parent-child' },
  { officerA: 'cao-cao',    officerB: 'cao-zhang',  kind: 'parent-child' },
  { officerA: 'cao-cao',    officerB: 'cao-zhi',    kind: 'parent-child' },
  { officerA: 'cao-cao',    officerB: 'cao-ang',    kind: 'parent-child' },
  { officerA: 'cao-cao',    officerB: 'cao-chong',  kind: 'parent-child' },
  { officerA: 'cao-cao',    officerB: 'cao-yu',     kind: 'parent-child' },
  { officerA: 'cao-cao',    officerB: 'cao-gun',    kind: 'parent-child' },
  { officerA: 'cao-cao',    officerB: 'cao-lin',    kind: 'parent-child' },
  { officerA: 'cao-cao',    officerB: 'cao-hua',    kind: 'parent-child' }, // Princess Qinghe
  // Cao Pi's son Cao Rui (Emperor Ming of Wei) and his son Cao Fang
  { officerA: 'cao-pi',     officerB: 'cao-rui',    kind: 'parent-child' },
  { officerA: 'cao-rui',    officerB: 'cao-fang',   kind: 'parent-child' }, // adopted, but functional
  // Cao Rui's other son Cao Mao + Cao Huan (later emperors via different branches)
  // Cao siblings & cousins
  { officerA: 'cao-pi',     officerB: 'cao-zhang',  kind: 'sibling' },
  { officerA: 'cao-pi',     officerB: 'cao-zhi',    kind: 'sibling' },
  { officerA: 'cao-pi',     officerB: 'cao-ang',    kind: 'sibling' },
  { officerA: 'cao-zhang',  officerB: 'cao-zhi',    kind: 'sibling' },
  { officerA: 'cao-chong',  officerB: 'cao-pi',     kind: 'sibling' },
  { officerA: 'cao-chong',  officerB: 'cao-zhi',    kind: 'sibling' },
  // Cao Cao's cousins / clan members: Cao Ren, Cao Hong, Cao Xiu, Cao Zhen
  { officerA: 'cao-cao',    officerB: 'cao-ren',    kind: 'sibling' }, // first cousins; close enough
  { officerA: 'cao-cao',    officerB: 'cao-hong',   kind: 'sibling' },
  { officerA: 'cao-ren',    officerB: 'cao-chun',   kind: 'sibling' },
  { officerA: 'cao-ren',    officerB: 'cao-hong',   kind: 'sibling' },
  { officerA: 'cao-zhen',   officerB: 'cao-shuang', kind: 'parent-child' },
  // Cao Cao's wives
  { officerA: 'cao-cao',    officerB: 'bian-shi',   kind: 'spouse' },     // Empress Bian
  { officerA: 'cao-cao',    officerB: 'ding-shi',   kind: 'spouse' },     // Lady Ding (first)
  { officerA: 'cao-cao',    officerB: 'zou-shi',    kind: 'spouse' },     // Lady Zou
  { officerA: 'bian-shi',   officerB: 'cao-pi',     kind: 'parent-child' },
  { officerA: 'bian-shi',   officerB: 'cao-zhang',  kind: 'parent-child' },
  { officerA: 'bian-shi',   officerB: 'cao-zhi',    kind: 'parent-child' },
  // Cao Pi's wife Empress Zhen + son Cao Rui
  { officerA: 'cao-pi',     officerB: 'zhen-shi',   kind: 'spouse' },     // Lady Zhen
  { officerA: 'zhen-shi',   officerB: 'cao-rui',    kind: 'parent-child' },
  // Cao Pi later married Empress Guo
  { officerA: 'cao-pi',     officerB: 'guo-nuwang', kind: 'spouse' },

  // ═══════════════════════════════════════════════════════════════════
  // 夏侯氏 (House of Xiahou — Cao Cao's clan by adoption)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'xiahou-dun', officerB: 'xiahou-yuan', kind: 'sibling' },   // cousins; close enough
  { officerA: 'xiahou-dun', officerB: 'xiahou-mao',  kind: 'parent-child' },
  { officerA: 'xiahou-yuan',officerB: 'xiahou-ba',   kind: 'parent-child' },
  { officerA: 'xiahou-yuan',officerB: 'xiahou-wei',  kind: 'parent-child' },
  { officerA: 'xiahou-yuan',officerB: 'xiahou-he',   kind: 'parent-child' },
  { officerA: 'xiahou-yuan',officerB: 'xiahou-rong', kind: 'parent-child' },
  { officerA: 'xiahou-ba',  officerB: 'xiahou-wei',  kind: 'sibling' },
  { officerA: 'xiahou-ba',  officerB: 'xiahou-he',   kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // 司馬氏 (House of Sima — would eventually rule as Jin)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'sima-yi',    officerB: 'sima-shi',   kind: 'parent-child' },
  { officerA: 'sima-yi',    officerB: 'sima-zhao',  kind: 'parent-child' },
  { officerA: 'sima-yi',    officerB: 'sima-fu',    kind: 'sibling' },
  { officerA: 'sima-shi',   officerB: 'sima-zhao',  kind: 'sibling' },
  { officerA: 'sima-zhao',  officerB: 'sima-yan',   kind: 'parent-child' }, // founder of Jin
  { officerA: 'sima-zhao',  officerB: 'sima-you',   kind: 'parent-child' },
  { officerA: 'sima-yi',    officerB: 'zhang-chunhua', kind: 'spouse' },   // Lady Zhang Chunhua
  { officerA: 'zhang-chunhua', officerB: 'sima-shi', kind: 'parent-child' },
  { officerA: 'zhang-chunhua', officerB: 'sima-zhao', kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 諸葛氏 (House of Zhuge — split across three kingdoms!)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'zhuge-liang',officerB: 'zhuge-jin',  kind: 'sibling' },    // brothers, Shu vs Wu
  { officerA: 'zhuge-liang',officerB: 'zhuge-jun',  kind: 'sibling' },
  { officerA: 'zhuge-jin',  officerB: 'zhuge-ke',   kind: 'parent-child' },
  { officerA: 'zhuge-jin',  officerB: 'zhuge-rong', kind: 'parent-child' },
  { officerA: 'zhuge-liang',officerB: 'zhuge-zhan', kind: 'parent-child' },
  { officerA: 'zhuge-zhan', officerB: 'zhuge-shang',kind: 'parent-child' },
  { officerA: 'zhuge-liang',officerB: 'huang-yueying', kind: 'spouse' },  // Lady Huang
  { officerA: 'huang-yueying', officerB: 'zhuge-zhan', kind: 'parent-child' },
  // Cousin in Wei: Zhuge Dan
  { officerA: 'zhuge-liang',officerB: 'zhuge-dan',  kind: 'sibling' },    // distant cousin
  { officerA: 'zhuge-jin',  officerB: 'zhuge-dan',  kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // 孫氏 (House of Sun — Eastern Wu)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'sun-jian',   officerB: 'sun-ce',     kind: 'parent-child' },
  { officerA: 'sun-jian',   officerB: 'sun-quan',   kind: 'parent-child' },
  { officerA: 'sun-jian',   officerB: 'sun-yi',     kind: 'parent-child' },
  { officerA: 'sun-jian',   officerB: 'sun-kuang',  kind: 'parent-child' },
  { officerA: 'sun-jian',   officerB: 'sun-shangxiang', kind: 'parent-child' }, // Lady Sun → marries Liu Bei
  { officerA: 'sun-ce',     officerB: 'sun-quan',   kind: 'sibling' },
  { officerA: 'sun-ce',     officerB: 'sun-yi',     kind: 'sibling' },
  { officerA: 'sun-ce',     officerB: 'sun-shangxiang', kind: 'sibling' },
  { officerA: 'sun-quan',   officerB: 'sun-yi',     kind: 'sibling' },
  { officerA: 'sun-quan',   officerB: 'sun-shangxiang', kind: 'sibling' },
  { officerA: 'sun-quan',   officerB: 'sun-deng',   kind: 'parent-child' },
  { officerA: 'sun-quan',   officerB: 'sun-he',     kind: 'parent-child' },
  { officerA: 'sun-quan',   officerB: 'sun-liang',  kind: 'parent-child' },
  { officerA: 'sun-quan',   officerB: 'sun-xiu',    kind: 'parent-child' },
  { officerA: 'sun-quan',   officerB: 'sun-ba',     kind: 'parent-child' },
  { officerA: 'sun-he',     officerB: 'sun-hao',    kind: 'parent-child' }, // last emperor of Wu
  // Sun Jian's wife Lady Wu
  { officerA: 'sun-jian',   officerB: 'wu-furen',   kind: 'spouse' },
  { officerA: 'wu-furen',   officerB: 'sun-ce',     kind: 'parent-child' },
  { officerA: 'wu-furen',   officerB: 'sun-quan',   kind: 'parent-child' },
  // Sun Ce's wife Da Qiao; Sun Quan's wife Bu Lianshi
  { officerA: 'sun-ce',     officerB: 'da-qiao',    kind: 'spouse' },
  { officerA: 'sun-quan',   officerB: 'bu-lianshi', kind: 'spouse' },
  // Zhou Yu + Xiao Qiao (Da Qiao's sister)
  { officerA: 'zhou-yu',    officerB: 'xiao-qiao',  kind: 'spouse' },
  { officerA: 'da-qiao',    officerB: 'xiao-qiao',  kind: 'sibling' },    // famous "Two Qiaos"
  { officerA: 'zhou-yu',    officerB: 'zhou-xun',   kind: 'parent-child' },
  { officerA: 'zhou-yu',    officerB: 'zhou-yin',   kind: 'parent-child' },
  // Sun's general family: Sun Yi → Sun Jun → Sun Chen
  { officerA: 'sun-jun',    officerB: 'sun-chen',   kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // 劉氏 (House of Liu — Shu Han imperial family)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'liu-bei',    officerB: 'liu-shan',   kind: 'parent-child' },
  { officerA: 'liu-bei',    officerB: 'liu-feng',   kind: 'parent-child' }, // adopted son
  { officerA: 'liu-bei',    officerB: 'liu-yong',   kind: 'parent-child' },
  { officerA: 'liu-bei',    officerB: 'liu-li',     kind: 'parent-child' },
  { officerA: 'liu-shan',   officerB: 'liu-xuan',   kind: 'parent-child' },
  { officerA: 'liu-shan',   officerB: 'liu-yao-sh', kind: 'parent-child' },
  { officerA: 'liu-shan',   officerB: 'liu-zong',   kind: 'parent-child' },
  { officerA: 'liu-shan',   officerB: 'liu-zan-sh', kind: 'parent-child' },
  // Liu Bei's wives
  { officerA: 'liu-bei',    officerB: 'gan-furen',  kind: 'spouse' },     // mother of Liu Shan
  { officerA: 'liu-bei',    officerB: 'mi-furen',   kind: 'spouse' },     // Lady Mi (sister of Mi Zhu)
  { officerA: 'liu-bei',    officerB: 'sun-shangxiang', kind: 'spouse' }, // famous political marriage
  { officerA: 'liu-bei',    officerB: 'wu-shi',     kind: 'spouse' },     // Empress Wu
  { officerA: 'gan-furen',  officerB: 'liu-shan',   kind: 'parent-child' },
  // Mi Zhu + Lady Mi (siblings)
  { officerA: 'mi-zhu',     officerB: 'mi-furen',   kind: 'sibling' },
  { officerA: 'mi-zhu',     officerB: 'mi-fang',    kind: 'sibling' },
  // Liu Biao + family (rival Liu)
  { officerA: 'liu-biao',   officerB: 'liu-qi',     kind: 'parent-child' },
  { officerA: 'liu-biao',   officerB: 'liu-cong',   kind: 'parent-child' },
  { officerA: 'liu-qi',     officerB: 'liu-cong',   kind: 'sibling' },
  { officerA: 'liu-biao',   officerB: 'cai-furen',  kind: 'spouse' },
  // Liu Yan + Liu Zhang (Yi province)
  { officerA: 'liu-yan',    officerB: 'liu-zhang',  kind: 'parent-child' },
  { officerA: 'liu-yan',    officerB: 'liu-fan',    kind: 'parent-child' },
  { officerA: 'liu-yan',    officerB: 'liu-mao',    kind: 'parent-child' },
  { officerA: 'liu-zhang',  officerB: 'liu-xun',    kind: 'parent-child' },
  { officerA: 'liu-zhang',  officerB: 'liu-fan',    kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // 關 / 張 / 趙 / 馬 (Shu's Five Tigers + descendants)
  // ═══════════════════════════════════════════════════════════════════
  // Guan Yu + sons Guan Ping (adopted), Guan Xing; grandson Guan Yi
  { officerA: 'guan-yu',    officerB: 'guan-ping',  kind: 'parent-child' },
  { officerA: 'guan-yu',    officerB: 'guan-xing',  kind: 'parent-child' },
  { officerA: 'guan-yu',    officerB: 'guan-suo',   kind: 'parent-child' },
  { officerA: 'guan-ping',  officerB: 'guan-xing',  kind: 'sibling' },
  { officerA: 'guan-ping',  officerB: 'guan-suo',   kind: 'sibling' },
  { officerA: 'guan-xing',  officerB: 'guan-yi',    kind: 'parent-child' },
  { officerA: 'guan-xing',  officerB: 'guan-tong',  kind: 'parent-child' },
  // Zhang Fei + sons Zhang Bao, Zhang Shao (Empress Zhang)
  { officerA: 'zhang-fei',  officerB: 'zhang-bao-sf', kind: 'parent-child' },
  { officerA: 'zhang-fei',  officerB: 'zhang-shao', kind: 'parent-child' },
  { officerA: 'zhang-fei',  officerB: 'zhang-ji',   kind: 'parent-child' },
  // Lady Xiahou (cousin captured by Zhang Fei → wife) → Zhang Bao
  { officerA: 'zhang-fei',  officerB: 'xiahou-shi', kind: 'spouse' },
  // Ma Chao + brother Ma Dai
  { officerA: 'ma-teng',    officerB: 'ma-chao',    kind: 'parent-child' },
  { officerA: 'ma-teng',    officerB: 'ma-tie',     kind: 'parent-child' },
  { officerA: 'ma-teng',    officerB: 'ma-xiu',     kind: 'parent-child' },
  { officerA: 'ma-chao',    officerB: 'ma-tie',     kind: 'sibling' },
  { officerA: 'ma-chao',    officerB: 'ma-xiu',     kind: 'sibling' },
  { officerA: 'ma-chao',    officerB: 'ma-dai',     kind: 'sibling' },  // cousins
  { officerA: 'ma-liang',   officerB: 'ma-su',      kind: 'sibling' },  // "Five Chang" Ma brothers
  // Zhao Yun + sons
  { officerA: 'zhao-yun',   officerB: 'zhao-tong',  kind: 'parent-child' },
  { officerA: 'zhao-yun',   officerB: 'zhao-guang', kind: 'parent-child' },
  { officerA: 'zhao-tong',  officerB: 'zhao-guang', kind: 'sibling' },
  // Huang Zhong (no sons in record); Wei Yan (no canonical son)

  // ═══════════════════════════════════════════════════════════════════
  // 袁 / 董 / 呂 family
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'yuan-shao',  officerB: 'yuan-tan',   kind: 'parent-child' },
  { officerA: 'yuan-shao',  officerB: 'yuan-xi',    kind: 'parent-child' },
  { officerA: 'yuan-shao',  officerB: 'yuan-shang', kind: 'parent-child' },
  { officerA: 'yuan-tan',   officerB: 'yuan-xi',    kind: 'sibling' },
  { officerA: 'yuan-tan',   officerB: 'yuan-shang', kind: 'sibling' },
  { officerA: 'yuan-xi',    officerB: 'yuan-shang', kind: 'sibling' },
  // Yuan Shao + Lady Liu
  { officerA: 'yuan-shao',  officerB: 'liu-furen',  kind: 'spouse' },
  // Yuan Shao + Yuan Shu (half-brothers — same father Yuan Feng)
  { officerA: 'yuan-shao',  officerB: 'yuan-shu',   kind: 'sibling' },
  { officerA: 'yuan-shu',   officerB: 'yuan-yao',   kind: 'parent-child' },
  // Dong Zhuo + Diao Chan (adopted) + Lü Bu (adopted son) — complex
  { officerA: 'dong-zhuo',  officerB: 'diao-chan',  kind: 'parent-child' },  // adopted
  { officerA: 'lu-bu',      officerB: 'diao-chan',  kind: 'spouse' },        // famous love triangle
  { officerA: 'lu-bu',      officerB: 'lu-furen',   kind: 'spouse' },        // formal wife
  { officerA: 'lu-bu',      officerB: 'lu-lingqi',  kind: 'parent-child' },  // daughter
  // Dong's daughter Dong Bai
  { officerA: 'dong-zhuo',  officerB: 'dong-bai',   kind: 'parent-child' },  // niece-granddaughter

  // ═══════════════════════════════════════════════════════════════════
  // 蔡 family (Cai Yong, Cai Yan)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'cai-yong',   officerB: 'cai-yan',    kind: 'parent-child' },
  { officerA: 'cai-yong',   officerB: 'cai-wenji',  kind: 'parent-child' },  // Wenji = Yan; both ids may exist
  // Cai Mao + sister Cai Furen
  { officerA: 'cai-mao',    officerB: 'cai-furen',  kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // Wei generals' families
  // ═══════════════════════════════════════════════════════════════════
  // Xun Yu (Wei's "Zhang Liang") + cousin Xun You
  { officerA: 'xun-yu',     officerB: 'xun-you',    kind: 'sibling' },
  // Zhong Yao + son Zhong Hui
  { officerA: 'zhong-yao',  officerB: 'zhong-hui',  kind: 'parent-child' },
  { officerA: 'zhong-yao',  officerB: 'zhong-yu',   kind: 'parent-child' },
  { officerA: 'zhong-hui',  officerB: 'zhong-yu',   kind: 'sibling' },
  // Jia Xu + son Jia Mu
  { officerA: 'jia-xu',     officerB: 'jia-mu',     kind: 'parent-child' },
  // Zhang Liao no canonical son in major roster
  // Cao Cao's other clan: Xiahou Dun's daughter married Zhang Fei → Zhang Bao etc. (already above)

  // ═══════════════════════════════════════════════════════════════════
  // 鄧 (Deng Ai) + 姜 (Jiang Wei) generation
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'deng-ai',    officerB: 'deng-zhong', kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 陸 (Lu Xun) Wu family
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'lu-xun',     officerB: 'lu-kang',    kind: 'parent-child' },
  { officerA: 'lu-kang',    officerB: 'lu-ji-sh',   kind: 'parent-child' },
  // Lu Xun's wife Lady Sun (Sun Ce's daughter)
  { officerA: 'lu-xun',     officerB: 'sun-lu-ban', kind: 'spouse' }, // some accounts disagree but historical
  // Lu Su (no famous descendants in roster)

  // ═══════════════════════════════════════════════════════════════════
  // 王朗 / 鍾 / 程 / etc.
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'wang-lang',  officerB: 'wang-su',    kind: 'parent-child' },
  { officerA: 'wang-su',    officerB: 'wang-yuanji',kind: 'parent-child' },  // → mother of Sima Yan
  { officerA: 'sima-zhao',  officerB: 'wang-yuanji',kind: 'spouse' },
  // Chen Qun
  { officerA: 'chen-qun',   officerB: 'chen-tai',   kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 姓朱 / 趙範 / 賈 / others
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'zhao-fan',   officerB: 'fan-shi',    kind: 'sibling' },   // sister Lady Fan

  // ═══════════════════════════════════════════════════════════════════
  // 公孫 family
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'gongsun-du', officerB: 'gongsun-kang', kind: 'parent-child' },
  { officerA: 'gongsun-kang', officerB: 'gongsun-yuan', kind: 'parent-child' },
  { officerA: 'gongsun-kang', officerB: 'gongsun-huang', kind: 'parent-child' },
  { officerA: 'gongsun-yuan', officerB: 'gongsun-huang', kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // 漢室 / 何氏 (Late Han imperial court — He Jin's clan & emperors)
  // ═══════════════════════════════════════════════════════════════════
  // He Jin (regent), Empress He, He Miao — siblings of the same Nan-yang butcher family
  { officerA: 'he-jin',     officerB: 'he-hou',     kind: 'sibling' },
  { officerA: 'he-jin',     officerB: 'he-miao',    kind: 'sibling' },
  { officerA: 'he-hou',     officerB: 'he-miao',    kind: 'sibling' },
  // Empress He → Emperor Shao (Liu Bian)
  { officerA: 'he-hou',     officerB: 'liu-bian',   kind: 'parent-child' },
  // Lady Wang Meiren → Emperor Xian (Liu Xie) — half-brothers via the same father (Han Lingdi)
  { officerA: 'wang-meiren',officerB: 'liu-xie',    kind: 'parent-child' },
  // Liu Bian and Liu Xie were half-brothers (same father)
  { officerA: 'liu-bian',   officerB: 'liu-xie',    kind: 'sibling' },
  // Empress Dowager Dong was grandmother to Liu Xie / mother of Han Lingdi (functional grandparent)
  { officerA: 'dong-taihou',officerB: 'liu-xie',    kind: 'parent-child' },
  // Empress Fu (Lady Fu) — wife of Emperor Xian; father Fu Wan
  { officerA: 'liu-xie',    officerB: 'fu-shi',     kind: 'spouse' },
  { officerA: 'fu-wan',     officerB: 'fu-shi',     kind: 'parent-child' },
  // Empress Cao — Cao Cao's daughter, married Emperor Xian
  { officerA: 'liu-xie',    officerB: 'empress-cao',kind: 'spouse' },
  { officerA: 'cao-cao',    officerB: 'empress-cao',kind: 'parent-child' },
  // Cao Cao's three daughters all married Emperor Xian; Cao Jie + Cao Hua are sisters of Empress Cao
  { officerA: 'cao-cao',    officerB: 'cao-jie',    kind: 'parent-child' },
  { officerA: 'cao-jie',    officerB: 'empress-cao',kind: 'sibling' },
  { officerA: 'cao-jie',    officerB: 'cao-hua',    kind: 'sibling' },
  { officerA: 'empress-cao',officerB: 'cao-hua',    kind: 'sibling' },
  // Dong Cheng + daughter Lady Dong (Han imperial concubine of Liu Xie)
  { officerA: 'dong-cheng', officerB: 'dong-jue',   kind: 'parent-child' }, // Lady Dong Gui-ren

  // ═══════════════════════════════════════════════════════════════════
  // 楊氏 (Hongnong Yang clan — Yang Biao + Yang Xiu)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'yang-biao',  officerB: 'yang-xiu',   kind: 'parent-child' },
  // Yang Zhen — celebrated ancestor of the clan
  { officerA: 'yang-zhen',  officerB: 'yang-biao',  kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 司馬氏 extended (Sima Lang, Sima Fu, Sima Fang the patriarch)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'sima-fang',  officerB: 'sima-lang',  kind: 'parent-child' },
  { officerA: 'sima-fang',  officerB: 'sima-yi',    kind: 'parent-child' },
  { officerA: 'sima-fang',  officerB: 'sima-fu',    kind: 'parent-child' },
  { officerA: 'sima-lang',  officerB: 'sima-yi',    kind: 'sibling' },
  { officerA: 'sima-lang',  officerB: 'sima-fu',    kind: 'sibling' },
  // Sima Yi's other sons (the eight Da, partial roster): Sima Liang, Sima Lun, Sima You
  { officerA: 'sima-yi',    officerB: 'sima-liang', kind: 'parent-child' },
  { officerA: 'sima-yi',    officerB: 'sima-lun',   kind: 'parent-child' },
  { officerA: 'sima-yi',    officerB: 'sima-you',   kind: 'parent-child' },
  { officerA: 'sima-shi',   officerB: 'sima-liang', kind: 'sibling' },
  { officerA: 'sima-shi',   officerB: 'sima-lun',   kind: 'sibling' },
  { officerA: 'sima-zhao',  officerB: 'sima-liang', kind: 'sibling' },
  { officerA: 'sima-zhao',  officerB: 'sima-lun',   kind: 'sibling' },
  // Sima Yan (Emperor Wu of Jin) → sons Sima Zhong (Emperor Hui), Sima Yu
  { officerA: 'sima-yan',   officerB: 'sima-zhong', kind: 'parent-child' },
  { officerA: 'sima-yan',   officerB: 'sima-yu',    kind: 'parent-child' },
  { officerA: 'sima-zhong', officerB: 'sima-yu',    kind: 'sibling' },
  // Sima Zhao + Wang Yuanji → Sima Yan
  { officerA: 'wang-yuanji',officerB: 'sima-yan',   kind: 'parent-child' },
  // Sima Fu → Sima Wang (his son)
  { officerA: 'sima-fu',    officerB: 'sima-wang',  kind: 'parent-child' },
  // The Eight Kings of Jin (later generation): Sima Ai, Sima Jiong, Sima Ying, Sima Yong, Sima Yong-jin, Sima Jun
  { officerA: 'sima-yan',   officerB: 'sima-ai',    kind: 'parent-child' },
  { officerA: 'sima-yan',   officerB: 'sima-ying',  kind: 'parent-child' },
  { officerA: 'sima-zhou',  officerB: 'sima-jun',   kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 呂氏 (Lü Bu's daughter, foster connections)
  // ═══════════════════════════════════════════════════════════════════
  // Lü Bu + Diaochan + his daughter (already partially in roster as lady-xu — wife)
  { officerA: 'lu-bu',      officerB: 'lady-yan',   kind: 'spouse' },
  { officerA: 'lu-bu',      officerB: 'lady-xu',    kind: 'spouse' },     // formal wife; betrothed daughter to Yuan Shu's son

  // ═══════════════════════════════════════════════════════════════════
  // 龐氏 (Pang De + son Pang Hui; Pang Tong + uncle Pang Degong)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'pang-de',    officerB: 'pang-hui',   kind: 'parent-child' },
  // Pang Degong is Pang Tong's uncle, and father-in-law of Zhuge Liang's sister (Liang's clan tie)
  { officerA: 'pang-degong',officerB: 'pang-tong',  kind: 'parent-child' }, // adoptive / clan uncle treated as parent

  // ═══════════════════════════════════════════════════════════════════
  // 趙氏 (Zhao Fan of Changsha + sister-in-law Lady Fan)
  // ═══════════════════════════════════════════════════════════════════
  // Lady Fan — widow of Zhao Fan's elder brother; story of Zhao Yun's refused match
  { officerA: 'zhao-fan',   officerB: 'lady-fan',   kind: 'sibling' },    // sister-in-law (treated as sibling by roster)

  // ═══════════════════════════════════════════════════════════════════
  // 韓遂家 (Han Sui + son Han De — Liang Province coalition)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'han-sui',    officerB: 'han-de',     kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 陶謙家 (Tao Qian of Xuzhou + sons Tao Shang and Tao Ying)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'tao-qian',   officerB: 'tao-shang',  kind: 'parent-child' },
  { officerA: 'tao-qian',   officerB: 'tao-ying',   kind: 'parent-child' },
  { officerA: 'tao-shang',  officerB: 'tao-ying',   kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // 王允家 (Wang Yun — Diaochan's foster father in the Romance)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'wang-yun',   officerB: 'diaochan',   kind: 'parent-child' }, // adoptive father (Romance)

  // ═══════════════════════════════════════════════════════════════════
  // 崔氏 (Cui Yan + cousins Cui Jun, Cui Lin)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'cui-yan',    officerB: 'cui-jun',    kind: 'sibling' },    // clansman / cousin
  { officerA: 'cui-yan',    officerB: 'cui-lin',    kind: 'sibling' },
  { officerA: 'cui-jun',    officerB: 'cui-lin',    kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // 諸葛氏 (additional — adopted son Zhuge Qiao, cousin Zhuge Rong)
  // ═══════════════════════════════════════════════════════════════════
  // Zhuge Qiao was Zhuge Jin's son, adopted by Zhuge Liang
  { officerA: 'zhuge-jin',  officerB: 'zhuge-qiao', kind: 'parent-child' }, // biological father
  { officerA: 'zhuge-liang',officerB: 'zhuge-qiao', kind: 'parent-child' }, // adoptive father
  { officerA: 'zhuge-qiao', officerB: 'zhuge-ke',   kind: 'sibling' },
  { officerA: 'zhuge-qiao', officerB: 'zhuge-rong', kind: 'sibling' },
  { officerA: 'zhuge-qiao', officerB: 'zhuge-zhan', kind: 'sibling' },     // through adoption

  // ═══════════════════════════════════════════════════════════════════
  // 孫氏 extended (Sun Quan's daughters & their husbands)
  // ═══════════════════════════════════════════════════════════════════
  // Sun Luban (Princess Quan) — daughter of Sun Quan, wife of Quan Cong
  { officerA: 'sun-quan',   officerB: 'sun-luban',  kind: 'parent-child' },
  { officerA: 'sun-quan',   officerB: 'sun-luyu',   kind: 'parent-child' },
  { officerA: 'sun-luban',  officerB: 'sun-luyu',   kind: 'sibling' },
  { officerA: 'sun-luban',  officerB: 'quan-cong',  kind: 'spouse' },
  { officerA: 'quan-cong',  officerB: 'quan-yi',    kind: 'parent-child' },
  { officerA: 'quan-cong',  officerB: 'quan-ji',    kind: 'parent-child' },
  { officerA: 'quan-yi',    officerB: 'quan-ji',    kind: 'sibling' },
  // Bu Lianshi → Sun Luban / Sun Luyu (biological mother)
  { officerA: 'bu-lianshi', officerB: 'sun-luban',  kind: 'parent-child' },
  { officerA: 'bu-lianshi', officerB: 'sun-luyu',   kind: 'parent-child' },
  // Sun Jian's brother Sun Jing (uncle clan-head)
  { officerA: 'sun-jian',   officerB: 'sun-jing',   kind: 'sibling' },
  { officerA: 'sun-jing',   officerB: 'sun-jiao',   kind: 'parent-child' },
  { officerA: 'sun-jing',   officerB: 'sun-yu',     kind: 'parent-child' },
  // Sun Ben + Sun Fu — sons of Sun Jian's elder brother (cousins to the Wu princes)
  { officerA: 'sun-ben',    officerB: 'sun-fu',     kind: 'sibling' },
  // Sun He → Sun Hao (already), and Sun Hao's brothers
  { officerA: 'sun-he',     officerB: 'sun-deng',   kind: 'sibling' },
  { officerA: 'sun-he',     officerB: 'sun-liang',  kind: 'sibling' },
  { officerA: 'sun-he',     officerB: 'sun-xiu',    kind: 'sibling' },
  { officerA: 'sun-he',     officerB: 'sun-ba',     kind: 'sibling' },
  // Sun Liang and Sun Xiu were also Sun Quan's sons (already through parent-child); siblings
  { officerA: 'sun-liang',  officerB: 'sun-xiu',    kind: 'sibling' },
  { officerA: 'sun-deng',   officerB: 'sun-liang',  kind: 'sibling' },
  { officerA: 'sun-deng',   officerB: 'sun-xiu',    kind: 'sibling' },
  // Sun Jun + cousin lineage — Sun Jun's father was Sun Jing's grandson; treat as Sun clan kin
  { officerA: 'sun-jing',   officerB: 'sun-jun',    kind: 'parent-child' }, // clan-line descent
  // Sun Ce's daughter married Lu Xun (Romance); use sun-shao as known progeny stand-in is wrong
  // — keeping existing lu-xun + sun-lu-ban marriage as-is; not duplicating

  // ═══════════════════════════════════════════════════════════════════
  // 凌氏 (Ling Cao + son Ling Tong)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'ling-cao',   officerB: 'ling-tong',  kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 周瑜 / 周魴 / 周泰 (Wu Zhou clan — note these are different lineages)
  // ═══════════════════════════════════════════════════════════════════
  // Zhou Fang + son Zhou Chu (Pacifying the Three Wrongs)
  { officerA: 'zhou-fang',  officerB: 'zhou-chu',   kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 馬氏 extended (Ma Liang + Ma Su are siblings — already there; add other brothers indirectly)
  // ═══════════════════════════════════════════════════════════════════
  // Ma Chao + Ma Teng's wife (also kept the Western Liang line going)
  // Ma Chao's son Ma Cheng / Ma Qiu missing from roster; skip

  // ═══════════════════════════════════════════════════════════════════
  // 曹氏 extended — Cao Xiu's son Cao Zhao
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'cao-xiu',    officerB: 'cao-zhao',   kind: 'parent-child' },
  // Cao Zhen + sons Cao Shuang and Cao Xun
  { officerA: 'cao-zhen',   officerB: 'cao-xun',    kind: 'parent-child' },
  { officerA: 'cao-shuang', officerB: 'cao-xun',    kind: 'sibling' },
  // Cao Cao's clan brothers: Cao Ren + Cao Chun share a father; Cao De is Cao Cao's brother
  { officerA: 'cao-cao',    officerB: 'cao-de',     kind: 'sibling' },
  // Cao Pi's other sons (besides Cao Rui): Cao Lin, Cao Yu — already; add Cao Hui, Cao Jiong, Cao Shu
  { officerA: 'cao-pi',     officerB: 'cao-hui',    kind: 'parent-child' },
  { officerA: 'cao-pi',     officerB: 'cao-jiong',  kind: 'parent-child' },
  { officerA: 'cao-pi',     officerB: 'cao-shu',    kind: 'parent-child' },
  { officerA: 'cao-rui',    officerB: 'cao-hui',    kind: 'sibling' },
  { officerA: 'cao-rui',    officerB: 'cao-jiong',  kind: 'sibling' },
  // Cao Mao + Cao Huan (later emperors — Cao Pi's grandsons via different sons)
  { officerA: 'cao-yu',     officerB: 'cao-huan',   kind: 'parent-child' },
  { officerA: 'cao-lin',    officerB: 'cao-mao',    kind: 'parent-child' },
  // Empress Mao — Cao Rui's first empress
  { officerA: 'cao-rui',    officerB: 'empress-mao',kind: 'spouse' },
  // Empress Bian's connection (Cao Cao + Lady Bian elders): Bian Bing + Bian Lan are her relatives
  { officerA: 'lady-bian',  officerB: 'bian-bing',  kind: 'sibling' },
  { officerA: 'lady-bian',  officerB: 'bian-lan',   kind: 'sibling' },
  { officerA: 'lady-bian',  officerB: 'cao-pi',     kind: 'parent-child' },
  { officerA: 'lady-bian',  officerB: 'cao-zhang',  kind: 'parent-child' },
  { officerA: 'lady-bian',  officerB: 'cao-zhi',    kind: 'parent-child' },
  // Lady Bian Younger — Cao Cao's later concubine
  { officerA: 'cao-cao',    officerB: 'lady-bian-younger', kind: 'spouse' },

  // ═══════════════════════════════════════════════════════════════════
  // 夏侯氏 extended (more cousins; Xiahou Hui = wife of Sima Shi)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'xiahou-shang',officerB: 'xiahou-xuan',kind: 'parent-child' },
  { officerA: 'xiahou-shang',officerB: 'xiahou-hui', kind: 'parent-child' },
  { officerA: 'xiahou-xuan',officerB: 'xiahou-hui', kind: 'sibling' },
  // Xiahou Hui married Sima Shi
  { officerA: 'sima-shi',   officerB: 'xiahou-hui', kind: 'spouse' },
  // Xiahou Yuan's other son Xiahou Cheng + Xiahou En + Xiahou Zhan
  { officerA: 'xiahou-yuan',officerB: 'xiahou-cheng',kind: 'parent-child' },
  { officerA: 'xiahou-yuan',officerB: 'xiahou-en',  kind: 'parent-child' },
  { officerA: 'xiahou-yuan',officerB: 'xiahou-zhan',kind: 'parent-child' },
  { officerA: 'xiahou-ba',  officerB: 'xiahou-cheng',kind: 'sibling' },
  { officerA: 'xiahou-ba',  officerB: 'xiahou-zhan',kind: 'sibling' },
  { officerA: 'xiahou-wei', officerB: 'xiahou-cheng',kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // 陸氏 extended (Lu Xun → Lu Kang → Lu Ji, Lu Yun-jin)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'lu-kang',    officerB: 'lu-ji-wu',   kind: 'parent-child' },  // Lu Ji (writer of Wenfu)
  { officerA: 'lu-kang',    officerB: 'lu-yun-jin', kind: 'parent-child' },  // Lu Yun (Lu Ji's brother)
  { officerA: 'lu-ji-wu',   officerB: 'lu-yun-jin', kind: 'sibling' },
  // Lu Xun's clan elders / cousins
  { officerA: 'lu-xun',     officerB: 'lu-mao',     kind: 'sibling' },       // clan kinsman
  { officerA: 'lu-xun',     officerB: 'lu-kai',     kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // 顧氏 (Gu Yong + son Gu Shao — Wu's grand chancellor lineage)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'gu-yong',    officerB: 'gu-shao',    kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 諸葛恪 family (Zhuge Ke + brothers, the rise and fall of Wu's regent)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'zhuge-ke',   officerB: 'zhuge-rong', kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // 鄧氏 (Deng Ai — son Deng Zhong already; nephew Deng Zhi is a different Deng)
  // ═══════════════════════════════════════════════════════════════════
  // (Deng Zhi belonged to the Shu Deng; do not link)

  // ═══════════════════════════════════════════════════════════════════
  // 王朗 extended (Wang Lang → Wang Su → Wang Yuanji; Wang Su's brothers)
  // ═══════════════════════════════════════════════════════════════════
  // Wang Ling — different Wang (Taiyuan); do not link to Wang Lang
  // Wang Jing — Wei loyalist, died at Cao Mao's coup; unrelated to Wang Lang line directly

  // ═══════════════════════════════════════════════════════════════════
  // 朱氏 (Zhu Ran adopted into Zhu clan; Zhu Huan; Zhu Ji)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'zhu-zhi',    officerB: 'zhu-ran',    kind: 'parent-child' }, // Zhu Ran was Zhu Zhi's adopted son
  { officerA: 'zhu-huan',   officerB: 'zhu-yi-wu',  kind: 'parent-child' },
  { officerA: 'zhu-ju',     officerB: 'zhu-ji-wu',  kind: 'parent-child' }, // clan tie via marriage to Sun Luyu

  // ═══════════════════════════════════════════════════════════════════
  // 米衡 / 衛覬 / 鄭玄 — scholar lines (mostly singletons in roster)
  // ═══════════════════════════════════════════════════════════════════
  // (Mi Heng had no recorded descendants in roster)

  // ═══════════════════════════════════════════════════════════════════
  // 蔣琬 / 費禕 / 董允 (Shu Four Statesmen — no surviving sons in roster)
  // ═══════════════════════════════════════════════════════════════════
  // Dong Yun's father Dong He — only Dong Yun is in roster

  // ═══════════════════════════════════════════════════════════════════
  // 全氏 (Quan family — full chain)
  // ═══════════════════════════════════════════════════════════════════
  // Already added quan-cong → quan-yi / quan-ji above

  // ═══════════════════════════════════════════════════════════════════
  // 荀氏 extended (Xun Yu + Xun Shu (father); Xun You is cousin; Xun Can is Yu's son)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'xun-shu',    officerB: 'xun-yu',     kind: 'parent-child' }, // patriarch Xun Shu of Yingchuan
  { officerA: 'xun-yu',     officerB: 'xun-can',    kind: 'parent-child' },
  { officerA: 'xun-yu',     officerB: 'xun-yi',     kind: 'parent-child' },
  { officerA: 'xun-can',    officerB: 'xun-yi',     kind: 'sibling' },
  { officerA: 'xun-shen',   officerB: 'xun-yu',     kind: 'sibling' },      // Xun Yu's cousin in roster
  // Xun Can married Cao Hong's daughter — not in roster, skip

  // ═══════════════════════════════════════════════════════════════════
  // 鍾繇 extended (Zhong Yao + Zhong Hui + Zhong Yu — already)
  // Add: Zhong Ji (different gen but clan)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'zhong-yao',  officerB: 'zhong-ji',   kind: 'sibling' },      // clan member

  // ═══════════════════════════════════════════════════════════════════
  // 賈氏 (Jia Xu's son Jia Mu — but missing; use Jia Kui line — different Jia)
  // ═══════════════════════════════════════════════════════════════════
  // Jia Kui + adopted son Jia Chong (Sima allies)
  { officerA: 'jia-kui',    officerB: 'jia-chong',  kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 孔融 family (no surviving male heirs in roster, only kong-zhou clan)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'kong-rong',  officerB: 'kong-zhou',  kind: 'sibling' },      // clan relative

  // ═══════════════════════════════════════════════════════════════════
  // Sun Ce's daughter (formal) — Lady Sun (married to Lu Xun)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'sun-ce',     officerB: 'lady-sun',   kind: 'parent-child' }, // adopted/daughter of Sun Ce
  { officerA: 'lu-xun',     officerB: 'lady-sun',   kind: 'spouse' },

  // ═══════════════════════════════════════════════════════════════════
  // 劉備 extended — Liu Bei + Empress Wu's son (Liu Yong), Empress Mu
  // ═══════════════════════════════════════════════════════════════════
  // Liu Shan's empress was Empress Zhang (Zhang Fei's daughter)
  { officerA: 'liu-shan',   officerB: 'empress-zhang',kind: 'spouse' },
  { officerA: 'zhang-fei',  officerB: 'empress-zhang',kind: 'parent-child' },
  // Empress Mu — daughter-in-law of Liu Bei via Liu Shan; Liu Shan's later empress
  { officerA: 'liu-shan',   officerB: 'empress-mu', kind: 'spouse' },
  // Liu Chan / Liu Chen — Liu Shan's son who died at Chengdu fall
  { officerA: 'liu-shan',   officerB: 'liu-chen',   kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 步氏 (Bu Zhi → Bu Chan, Bu Ji, Bu Xie)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'bu-zhi',     officerB: 'bu-chan',    kind: 'parent-child' },
  { officerA: 'bu-zhi',     officerB: 'bu-ji',      kind: 'parent-child' },
  { officerA: 'bu-zhi',     officerB: 'bu-xie',     kind: 'parent-child' },
  { officerA: 'bu-chan',    officerB: 'bu-ji',      kind: 'sibling' },
  { officerA: 'bu-chan',    officerB: 'bu-xie',     kind: 'sibling' },

  // ═══════════════════════════════════════════════════════════════════
  // 張氏 extended (Zhang Zhao + brothers; Zhang Hong of Wu)
  // ═══════════════════════════════════════════════════════════════════
  { officerA: 'zhang-zhao', officerB: 'zhang-cheng',kind: 'parent-child' }, // Zhang Cheng was Zhang Zhao's son
  // Zhang Liao + brother Zhang Fan-Wei (Zhang Fan of Wei)
  // (Different Zhang; do not link without confirmation)

  // ═══════════════════════════════════════════════════════════════════
  // 韓嵩 / 韓玄 / 韓當 / 韓浩 — separate Han lineages; only link where verified
  // ═══════════════════════════════════════════════════════════════════
  // Han Dang (Wu general) + son — not in roster
  // Han Xuan (Changsha governor) had no notable progeny

  // ═══════════════════════════════════════════════════════════════════
  // 太史 / 程 / 黃蓋 — Wu veterans (descendants partly absent from roster)
  // ═══════════════════════════════════════════════════════════════════
  // Cheng Pu had Cheng Zi (son) — cheng-zi exists
  { officerA: 'cheng-pu',   officerB: 'cheng-zi',   kind: 'parent-child' },

  // ═══════════════════════════════════════════════════════════════════
  // 法正 / 馬岱 / 王朗 — additions
  // ═══════════════════════════════════════════════════════════════════
  // Fa Zheng + father Fa Zhen (not in roster); but Fa Miao is grandfather
  // fa-miao exists — Fa Zheng's grandfather
  { officerA: 'fa-miao',    officerB: 'fa-zheng',   kind: 'parent-child' }, // grandfather treated as parent for clan

  // ═══════════════════════════════════════════════════════════════════
  // 馬騰 + father Ma Su (the Han general, different from Ma Liang's brother)
  // ═══════════════════════════════════════════════════════════════════
  // ma-su in roster refers to Ma Liang's brother (Shu); skip

  // ═══════════════════════════════════════════════════════════════════
  // 韓馥 / 韓嵩 — separate clans, no confirmed sons in roster
  // ═══════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════
  // 諸葛瑾 + Wu wife (Sun clan tie; not certain in roster — skip)
  // ═══════════════════════════════════════════════════════════════════
];
