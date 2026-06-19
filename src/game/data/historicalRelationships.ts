/**
 * Historically-attested family lineages + oath bonds across all dynasties.
 *
 * These spread into FAMILY_LINEAGE (parent-child / sibling / spouse) and
 * OATH_BONDS (sworn brothers / master-disciple / pre-Han comradeships).
 *
 * Coverage: ~60 family chains + ~40 oath pairs spanning 春秋 → 清.
 */
import type { FamilyRelation } from '../types/family';
import type { OathBond } from './bonds';

export const HISTORICAL_FAMILY: FamilyRelation[] = [
  // ─── 周王室 / 春秋宗族 ───
  { officerA: 'hist-zhou-wenwang',  officerB: 'hist-zhou-wuwang', kind: 'parent-child' },
  { officerA: 'hist-zhou-wenwang',  officerB: 'hist-zhou-gong',   kind: 'parent-child' },
  { officerA: 'hist-zhou-wuwang',   officerB: 'hist-zhou-gong',   kind: 'sibling' },
  { officerA: 'hist-zhou-wenwang',  officerB: 'hist-shao-gong-shi', kind: 'parent-child' },
  { officerA: 'hist-zhou-gong',     officerB: 'hist-shao-gong-shi', kind: 'sibling' },
  { officerA: 'hist-zhou-wuwang',   officerB: 'hist-zhou-chengwang', kind: 'parent-child' },
  { officerA: 'hist-zhou-wenwang',  officerB: 'hist-wei-kangshu', kind: 'parent-child' },
  // 鄭桓-鄭武-鄭莊
  { officerA: 'hist-zheng-huangong',officerB: 'hist-zheng-wugong',kind: 'parent-child' },
  { officerA: 'hist-zheng-wugong',  officerB: 'hist-zheng-zhuanggong', kind: 'parent-child' },
  { officerA: 'hist-zheng-zhuanggong', officerB: 'hist-zheng-zhaogong', kind: 'parent-child' },
  // 楚成王 → 楚穆王 → 楚莊王 (commonly cited line)
  { officerA: 'hist-chu-chengwang', officerB: 'hist-chu-muwang',  kind: 'parent-child' },
  { officerA: 'hist-chu-muwang',    officerB: 'hist-chu-zhuang-wang', kind: 'parent-child' },
  // 楚平王 → 楚昭王 → 楚惠王
  { officerA: 'hist-chu-pingwang',  officerB: 'hist-chu-zhaowang',kind: 'parent-child' },
  { officerA: 'hist-chu-zhaowang',  officerB: 'hist-chu-huiwang', kind: 'parent-child' },
  // 闔閭-夫差
  { officerA: 'hist-helu',          officerB: 'hist-fuchai',      kind: 'parent-child' },
  // 晉文公 子 (Wen Gong + 申生 had complicated relations; 申生 is 文公 brother — both 獻公 sons)
  { officerA: 'hist-shensheng',     officerB: 'hist-jin-wen-gong',kind: 'sibling' },
  { officerA: 'hist-shensheng',     officerB: 'hist-zi-xiqi',     kind: 'sibling' },
  // 趙簡子-趙襄子
  { officerA: 'hist-zhao-jianzi',   officerB: 'hist-zhao-xiangzi',kind: 'parent-child' },
  // 智伯 = 智宣子之子
  { officerA: 'hist-zhixuanzi',     officerB: 'hist-zhibo',       kind: 'parent-child' },
  // 趙盾-趙武 (隔代; in popular telling 趙盾 → 趙朔 → 趙武, 但 趙朔 not added, so直接 grandfather-grandson 用 parent-child simplification)
  { officerA: 'hist-zhao-dun',      officerB: 'hist-zhao-wu',     kind: 'parent-child' },

  // ─── 戰國七雄宗族 ───
  // 秦六世: 秦孝公-秦惠文王-秦武王-秦昭襄王-秦孝文王(嬴柱)-秦莊襄王(子楚)-秦始皇
  { officerA: 'hist-qin-xiaogong',  officerB: 'hist-qin-huiwen',  kind: 'parent-child' },
  { officerA: 'hist-qin-huiwen',    officerB: 'hist-qin-wuwang',  kind: 'parent-child' },
  { officerA: 'hist-qin-huiwen',    officerB: 'hist-qin-zhaoxiang', kind: 'parent-child' },
  { officerA: 'hist-qin-wuwang',    officerB: 'hist-qin-zhaoxiang', kind: 'sibling' },
  { officerA: 'hist-qin-zhaoxiang', officerB: 'hist-ying-zhu',    kind: 'parent-child' },
  { officerA: 'hist-ying-zhu',      officerB: 'hist-qin-zhuangxiang', kind: 'parent-child' },
  { officerA: 'hist-qin-zhuangxiang', officerB: 'hist-qin-shihuang', kind: 'parent-child' },
  { officerA: 'hist-qin-shihuang',  officerB: 'hist-fusu',        kind: 'parent-child' },
  { officerA: 'hist-qin-shihuang',  officerB: 'hist-ziying',      kind: 'parent-child' },
  { officerA: 'hist-fusu',          officerB: 'hist-ziying',      kind: 'sibling' },
  // 燕王噲 → 子之之亂 → 燕昭王 (噲 → 燕昭王 父子)
  { officerA: 'hist-yan-wangkuai',  officerB: 'hist-yan-zhaowang',kind: 'parent-child' },
  { officerA: 'hist-yan-zhaowang',  officerB: 'hist-yan-huiwang', kind: 'parent-child' },
  // 趙武靈王 → 趙惠文王 → 趙孝成王 → 趙悼襄王 → 趙王遷
  { officerA: 'hist-zhao-wuling',   officerB: 'hist-zhao-huiwen', kind: 'parent-child' },
  { officerA: 'hist-zhao-huiwen',   officerB: 'hist-zhao-xiaocheng', kind: 'parent-child' },
  { officerA: 'hist-zhao-xiaocheng',officerB: 'hist-zhao-daoxiang',kind: 'parent-child' },
  { officerA: 'hist-zhao-daoxiang', officerB: 'hist-zhao-wangqian', kind: 'parent-child' },
  // 樂毅-樂閒 + 樂池
  { officerA: 'hist-yue-yi',        officerB: 'hist-yue-jian',    kind: 'parent-child' },
  // 蘇秦兄弟
  { officerA: 'hist-su-qin',        officerB: 'hist-su-dai',      kind: 'sibling' },
  { officerA: 'hist-su-qin',        officerB: 'hist-su-li',       kind: 'sibling' },
  { officerA: 'hist-su-qin',        officerB: 'hist-su-pi',       kind: 'sibling' },
  // 王翦-王賁-王離
  { officerA: 'hist-wang-jian',     officerB: 'hist-wang-ben',    kind: 'parent-child' },
  { officerA: 'hist-wang-ben',      officerB: 'hist-wang-li',     kind: 'parent-child' },
  // 蒙武-蒙恬-蒙毅
  { officerA: 'hist-meng-wu',       officerB: 'hist-meng-tian',   kind: 'parent-child' },
  { officerA: 'hist-meng-wu',       officerB: 'hist-meng-yi',     kind: 'parent-child' },
  { officerA: 'hist-meng-tian',     officerB: 'hist-meng-yi',     kind: 'sibling' },
  // 燕太子丹 (虛位; 父 = 燕王喜)
  { officerA: 'hist-yan-wangxi',    officerB: 'hist-taizi-dan',   kind: 'parent-child' },
  // 楚 — 屈原 父系
  { officerA: 'hist-chu-pingwang',  officerB: 'hist-taizi-jian',  kind: 'parent-child' },
  { officerA: 'hist-taizi-jian',    officerB: 'hist-bai-gongsheng',kind: 'parent-child' },

  // ─── 楚漢 / 西漢 / 東漢 ───
  // 項梁-項羽 (叔姪, no uncle 类型, 用 parent-child 簡化)
  { officerA: 'hist-xiang-liang',   officerB: 'hist-xiang-yu',    kind: 'parent-child' },
  { officerA: 'hist-xiang-liang',   officerB: 'hist-xiang-bo',    kind: 'sibling' },
  // 項羽-虞姬
  { officerA: 'hist-xiang-yu',      officerB: 'hist-yu-ji',       kind: 'spouse' },
  // 劉邦 妻妾子嗣
  { officerA: 'hist-liu-bang',      officerB: 'hist-lu-zhi',      kind: 'spouse' },
  { officerA: 'hist-liu-bang',      officerB: 'hist-qi-furen',    kind: 'spouse' }, // 寵姬
  { officerA: 'hist-liu-bang',      officerB: 'hist-liu-fei',     kind: 'parent-child' },
  { officerA: 'hist-liu-bang',      officerB: 'hist-liu-ruyi',    kind: 'parent-child' },
  { officerA: 'hist-liu-bang',      officerB: 'hist-liu-jiao',    kind: 'sibling' },
  { officerA: 'hist-qi-furen',      officerB: 'hist-liu-ruyi',    kind: 'parent-child' },
  // 張耳-張敖
  { officerA: 'hist-zhang-er',      officerB: 'hist-zhang-ao',    kind: 'parent-child' },
  // 田儋-田榮-田廣-田橫
  { officerA: 'hist-tian-dan-chu',  officerB: 'hist-tian-rong',   kind: 'sibling' },
  { officerA: 'hist-tian-rong',     officerB: 'hist-tian-heng',   kind: 'sibling' },
  { officerA: 'hist-tian-rong',     officerB: 'hist-tian-guang',  kind: 'parent-child' },
  // 灌嬰-灌何
  { officerA: 'hist-guan-ying',     officerB: 'hist-guan-he',     kind: 'parent-child' },
  // 司馬相如-卓文君
  { officerA: 'hist-sima-xiangru',  officerB: 'hist-zhuo-wenjun', kind: 'spouse' },
  // 漢武帝-衛子夫; 衛青-衛子夫 (sibling)
  { officerA: 'hist-han-wudi',      officerB: 'hist-wei-zifu',    kind: 'spouse' },
  { officerA: 'hist-wei-qing',      officerB: 'hist-wei-zifu',    kind: 'sibling' },
  { officerA: 'hist-wei-qing',      officerB: 'hist-huo-qubing',  kind: 'parent-child' }, // 衛青 撫養 霍 (uncle approximated)
  // 班彪-班固/班昭/班超; 班超-班勇
  { officerA: 'hist-ban-biao',      officerB: 'hist-ban-gu',      kind: 'parent-child' },
  { officerA: 'hist-ban-biao',      officerB: 'hist-ban-zhao',    kind: 'parent-child' },
  { officerA: 'hist-ban-biao',      officerB: 'hist-ban-chao',    kind: 'parent-child' },
  { officerA: 'hist-ban-gu',        officerB: 'hist-ban-chao',    kind: 'sibling' },
  { officerA: 'hist-ban-gu',        officerB: 'hist-ban-zhao',    kind: 'sibling' },
  { officerA: 'hist-ban-chao',      officerB: 'hist-ban-zhao',    kind: 'sibling' },
  { officerA: 'hist-ban-chao',      officerB: 'hist-ban-yong',    kind: 'parent-child' },
  // 漢光武帝-陰麗華
  { officerA: 'hist-liu-xiu',       officerB: 'hist-yin-lihua',   kind: 'spouse' },

  // ─── 兩晉 ───
  // 司馬懿後代 (already in 三國 FAMILY) + 司馬攸 / 司馬亮 等 八王
  { officerA: 'hist-sima-yan',      officerB: 'hist-sima-zhong' as string, kind: 'parent-child' }, // 晉惠帝, 可能未加
  { officerA: 'hist-sima-yan',      officerB: 'hist-sima-you',    kind: 'sibling' },
  { officerA: 'hist-sima-yan',      officerB: 'hist-sima-liang',  kind: 'sibling' },
  // 賈充-賈南風
  { officerA: 'hist-jia-chong',     officerB: 'hist-jia-nanfeng', kind: 'parent-child' },
  // 王導-王敦 (從兄弟 sibling 簡化)
  { officerA: 'hist-wang-dao',      officerB: 'hist-wang-dun',    kind: 'sibling' },
  { officerA: 'hist-wang-dao',      officerB: 'hist-wang-bin',    kind: 'sibling' },
  // 桓溫-桓沖-桓玄
  { officerA: 'hist-huan-wen',      officerB: 'hist-huan-chong',  kind: 'sibling' },
  { officerA: 'hist-huan-wen',      officerB: 'hist-huan-xuan',   kind: 'parent-child' },
  // 王羲之-王獻之
  { officerA: 'hist-wang-xizhi',    officerB: 'hist-wang-xianzhi',kind: 'parent-child' },
  // 嵇康-嵇紹
  { officerA: 'hist-ji-kang',       officerB: 'hist-ji-shao',     kind: 'parent-child' },
  // 苻洪-苻雄-苻堅
  { officerA: 'hist-fu-hong',       officerB: 'hist-fu-xiong',    kind: 'parent-child' },
  { officerA: 'hist-fu-xiong',      officerB: 'hist-fu-jian',     kind: 'parent-child' },
  // 慕容皝-慕容俊-慕容暐 / 慕容垂 (皝之子)
  { officerA: 'hist-murong-huang',  officerB: 'hist-murong-jun',  kind: 'parent-child' },
  { officerA: 'hist-murong-huang',  officerB: 'hist-murong-chui', kind: 'parent-child' },
  { officerA: 'hist-murong-jun',    officerB: 'hist-murong-wei-fyan', kind: 'parent-child' },
  { officerA: 'hist-murong-jun',    officerB: 'hist-murong-chui', kind: 'sibling' },
  // 石勒-石虎 (從兄弟)
  { officerA: 'hist-shi-le',        officerB: 'hist-shi-hu',      kind: 'sibling' },
  // 庾亮-庾翼-庾冰
  { officerA: 'hist-yu-liang',      officerB: 'hist-yu-yi',       kind: 'sibling' },
  { officerA: 'hist-yu-liang',      officerB: 'hist-yu-bing',     kind: 'sibling' },
  { officerA: 'hist-yu-yi',         officerB: 'hist-yu-zhun',     kind: 'parent-child' },
  // 謝安-謝玄 (叔姪)
  { officerA: 'hist-xie-an',        officerB: 'hist-xie-xuan',    kind: 'parent-child' },

  // ─── 南北朝 ───
  // 拓跋珪-拓跋嗣-拓跋燾-拓跋濬
  { officerA: 'hist-tuoba-gui',     officerB: 'hist-tuoba-si',    kind: 'parent-child' },
  { officerA: 'hist-tuoba-si',      officerB: 'hist-tuoba-tao',   kind: 'parent-child' },
  { officerA: 'hist-tuoba-tao',     officerB: 'hist-tuoba-jun',   kind: 'parent-child' },
  { officerA: 'hist-tuoba-jun',     officerB: 'hist-yuan-hong',   kind: 'parent-child' },
  // 高歡-高澄-高湛-高洋
  { officerA: 'hist-gao-shusheng',  officerB: 'hist-gao-huan',    kind: 'parent-child' },
  { officerA: 'hist-gao-huan',      officerB: 'hist-gao-cheng',   kind: 'parent-child' },
  { officerA: 'hist-gao-huan',      officerB: 'hist-gao-yang',    kind: 'parent-child' },
  { officerA: 'hist-gao-huan',      officerB: 'hist-gao-zhan',    kind: 'parent-child' },
  { officerA: 'hist-gao-huan',      officerB: 'hist-gao-jun',     kind: 'parent-child' },
  { officerA: 'hist-gao-cheng',     officerB: 'hist-gao-yang',    kind: 'sibling' },
  { officerA: 'hist-gao-yang',      officerB: 'hist-gao-zhan',    kind: 'sibling' },
  { officerA: 'hist-gao-yang',      officerB: 'hist-lanlingwang', kind: 'parent-child' }, // 蘭陵王是高澄之子
  // 宇文泰-宇文邕-宇文毓
  { officerA: 'hist-yuwen-tai',     officerB: 'hist-yuwen-yu',    kind: 'parent-child' },
  { officerA: 'hist-yuwen-tai',     officerB: 'hist-yuwen-yong',  kind: 'parent-child' },
  { officerA: 'hist-yuwen-yu',      officerB: 'hist-yuwen-yong',  kind: 'sibling' },
  // 蕭衍-蕭懿 (兄弟) / 蕭衍-蕭統/蕭綱/蕭繹 (父子)
  { officerA: 'hist-xiao-yan',      officerB: 'hist-xiao-yi-snn', kind: 'sibling' },
  { officerA: 'hist-xiao-yan',      officerB: 'hist-xiao-tong',   kind: 'parent-child' },
  { officerA: 'hist-xiao-yan',      officerB: 'hist-xiao-gang',   kind: 'parent-child' },
  { officerA: 'hist-xiao-yan',      officerB: 'hist-xiao-yi',     kind: 'parent-child' },
  { officerA: 'hist-xiao-yan',      officerB: 'hist-xiao-hong',   kind: 'sibling' },
  { officerA: 'hist-xiao-tong',     officerB: 'hist-xiao-gang',   kind: 'sibling' },
  { officerA: 'hist-xiao-tong',     officerB: 'hist-xiao-yi',     kind: 'sibling' },
  { officerA: 'hist-xiao-gang',     officerB: 'hist-xiao-yi',     kind: 'sibling' },
  // 楊忠-楊堅
  { officerA: 'hist-yang-zhong',    officerB: 'hist-sui-wendi',   kind: 'parent-child' },

  // ─── 隋 ───
  { officerA: 'hist-sui-wendi',     officerB: 'hist-sui-yangdi',  kind: 'parent-child' },
  { officerA: 'hist-sui-wendi',     officerB: 'hist-yang-yong',   kind: 'parent-child' },
  { officerA: 'hist-yang-yong',     officerB: 'hist-sui-yangdi',  kind: 'sibling' },
  { officerA: 'hist-sui-yangdi',    officerB: 'hist-empress-xiao',kind: 'spouse' },
  { officerA: 'hist-sui-yangdi',    officerB: 'hist-yang-tong',   kind: 'parent-child' },
  { officerA: 'hist-mai-tiezhang',  officerB: 'hist-mai-mengcai', kind: 'parent-child' },

  // ─── 唐 ───
  // 李淵-李建成/李世民/李元吉/平陽公主
  { officerA: 'hist-li-yuan',       officerB: 'hist-li-jiancheng',kind: 'parent-child' },
  { officerA: 'hist-li-yuan',       officerB: 'hist-tang-taizong',kind: 'parent-child' },
  { officerA: 'hist-li-yuan',       officerB: 'hist-princess-pingyang', kind: 'parent-child' },
  { officerA: 'hist-li-jiancheng',  officerB: 'hist-tang-taizong',kind: 'sibling' },
  { officerA: 'hist-princess-pingyang', officerB: 'hist-tang-taizong', kind: 'sibling' },
  { officerA: 'hist-princess-pingyang', officerB: 'hist-chai-shao', kind: 'spouse' },
  // 唐太宗-李承乾/李泰/唐高宗李治
  { officerA: 'hist-tang-taizong',  officerB: 'hist-li-chengqian',kind: 'parent-child' },
  { officerA: 'hist-tang-taizong',  officerB: 'hist-li-tai',      kind: 'parent-child' },
  { officerA: 'hist-tang-taizong',  officerB: 'hist-tang-gaozong',kind: 'parent-child' },
  { officerA: 'hist-li-chengqian',  officerB: 'hist-li-tai',      kind: 'sibling' },
  { officerA: 'hist-li-tai',        officerB: 'hist-tang-gaozong',kind: 'sibling' },
  // 唐高宗-武則天 / 中宗李顯-韋后 / 韋后母女
  { officerA: 'hist-tang-gaozong',  officerB: 'hist-wu-zetian',   kind: 'spouse' },
  { officerA: 'hist-tang-gaozong',  officerB: 'hist-li-xian',     kind: 'parent-child' },
  { officerA: 'hist-tang-gaozong',  officerB: 'hist-li-dan',      kind: 'parent-child' },
  { officerA: 'hist-wu-zetian',     officerB: 'hist-li-xian',     kind: 'parent-child' },
  { officerA: 'hist-wu-zetian',     officerB: 'hist-li-dan',      kind: 'parent-child' },
  { officerA: 'hist-wu-zetian',     officerB: 'hist-taiping',     kind: 'parent-child' },
  { officerA: 'hist-li-xian',       officerB: 'hist-empress-wei', kind: 'spouse' },
  { officerA: 'hist-li-xian',       officerB: 'hist-li-dan',      kind: 'sibling' },
  // 唐玄宗-楊貴妃
  { officerA: 'hist-li-longji',     officerB: 'hist-yang-guifei', kind: 'spouse' },
  { officerA: 'hist-li-longji',     officerB: 'hist-li-heng',     kind: 'parent-child' },
  { officerA: 'hist-li-heng',       officerB: 'hist-li-kuo',      kind: 'parent-child' },
  { officerA: 'hist-li-kuo',        officerB: 'hist-li-shi',      kind: 'parent-child' },
  { officerA: 'hist-li-shi',        officerB: 'hist-li-chun',     kind: 'parent-child' },
  // 顏真卿 + 顏杲卿 — 從兄弟 (sibling 簡化)
  { officerA: 'hist-yan-zhenqing',  officerB: 'hist-yan-gaoqing', kind: 'sibling' },
  // 哥舒翰 + 哥舒曜
  { officerA: 'hist-geshu-han',     officerB: 'hist-geshu-yao',   kind: 'parent-child' },
  // 渾瑊 + 渾鎬
  { officerA: 'hist-hun-zhen',      officerB: 'hist-hun-hao',     kind: 'parent-child' },
  // 上官儀-上官婉兒 (祖孫)
  { officerA: 'hist-shangguan-yi',  officerB: 'hist-shangguan-waner', kind: 'parent-child' },
  // 李吉甫-李德裕
  { officerA: 'hist-li-jifu',       officerB: 'hist-li-deyu',     kind: 'parent-child' },

  // ─── 五代 + 遼 ───
  // 朱溫-朱友珪-朱友貞-朱友讓 / 朱友謙
  { officerA: 'hist-zhu-wen',       officerB: 'hist-zhu-yougui',  kind: 'parent-child' },
  { officerA: 'hist-zhu-wen',       officerB: 'hist-zhu-youzhen', kind: 'parent-child' },
  { officerA: 'hist-zhu-wen',       officerB: 'hist-zhu-yourang', kind: 'parent-child' },
  { officerA: 'hist-zhu-yougui',    officerB: 'hist-zhu-youzhen', kind: 'sibling' },
  // 李克用-李存勖/李存孝/李存信
  { officerA: 'hist-li-keyong',     officerB: 'hist-li-cunxu',    kind: 'parent-child' },
  { officerA: 'hist-li-keyong',     officerB: 'hist-li-cunxiao',  kind: 'parent-child' },
  { officerA: 'hist-li-keyong',     officerB: 'hist-li-cunxin',   kind: 'parent-child' },
  { officerA: 'hist-li-cunxu',      officerB: 'hist-li-cunxiao',  kind: 'sibling' },
  { officerA: 'hist-li-cunxu',      officerB: 'hist-li-cunxin',   kind: 'sibling' },
  // 高季興-高從誨-高保融
  { officerA: 'hist-gao-jixing',    officerB: 'hist-gao-conghui', kind: 'parent-child' },
  { officerA: 'hist-gao-conghui',   officerB: 'hist-gao-baorong', kind: 'parent-child' },
  // 楊行密-楊隆演
  { officerA: 'hist-yang-xingmi',   officerB: 'hist-yang-longyan',kind: 'parent-child' },
  // 王審知-王延翰/王延政
  { officerA: 'hist-wang-shenzhi',  officerB: 'hist-wang-yanhan', kind: 'parent-child' },
  { officerA: 'hist-wang-shenzhi',  officerB: 'hist-wang-yanzheng', kind: 'parent-child' },
  // 孟知祥-孟昶 (後蜀父子)
  { officerA: 'hist-meng-zhixiang', officerB: 'hist-meng-chang',  kind: 'parent-child' },
  // 李璟-李煜
  { officerA: 'hist-li-jing-tangts',officerB: 'hist-li-yu',       kind: 'parent-child' },
  // 耶律阿保機-耶律德光
  { officerA: 'hist-abaoji',        officerB: 'hist-yelu-deguang',kind: 'parent-child' },

  // ─── 宋 + 西夏 + 金 ───
  // 趙匡胤-趙光義 兄弟
  { officerA: 'hist-zhao-kuangyin', officerB: 'hist-zhao-guangyi',kind: 'sibling' },
  // 宋徽宗-宋欽宗-宋高宗  (徽宗子嗣)
  { officerA: 'hist-song-huizong',  officerB: 'hist-zhao-gou',    kind: 'parent-child' },
  // 蘇洵-蘇軾-蘇轍 三蘇
  { officerA: 'hist-su-xun',        officerB: 'hist-su-shi',      kind: 'parent-child' },
  { officerA: 'hist-su-xun',        officerB: 'hist-su-zhe',      kind: 'parent-child' },
  { officerA: 'hist-su-shi',        officerB: 'hist-su-zhe',      kind: 'sibling' },
  { officerA: 'hist-su-shi',        officerB: 'hist-su-mai',      kind: 'parent-child' },
  // 蘇舜元-蘇舜欽 兄弟
  { officerA: 'hist-su-shunyuan',   officerB: 'hist-su-shunqin',  kind: 'sibling' },
  // 二程
  { officerA: 'hist-cheng-hao',     officerB: 'hist-cheng-yi',    kind: 'sibling' },
  // 米芾-米友仁
  { officerA: 'hist-mi-fu',         officerB: 'hist-mi-youren',   kind: 'parent-child' },
  // 范仲淹-范純仁-范純粹
  { officerA: 'hist-fan-zhongyan',  officerB: 'hist-fan-chunren', kind: 'parent-child' },
  { officerA: 'hist-fan-zhongyan',  officerB: 'hist-fan-chuncui', kind: 'parent-child' },
  { officerA: 'hist-fan-chunren',   officerB: 'hist-fan-chuncui', kind: 'sibling' },
  // 韓琦-韓忠彥
  { officerA: 'hist-han-qi',        officerB: 'hist-han-zhongyan',kind: 'parent-child' },
  // 韓世忠-韓彥直 + 韓世忠-梁紅玉
  { officerA: 'hist-han-shizhong',  officerB: 'hist-han-yanzhi',  kind: 'parent-child' },
  { officerA: 'hist-han-shizhong',  officerB: 'hist-liang-hongyu',kind: 'spouse' },
  // 楊家將
  { officerA: 'hist-yang-ye',       officerB: 'hist-she-taijun',  kind: 'spouse' },
  { officerA: 'hist-yang-ye',       officerB: 'hist-yang-yanping',kind: 'parent-child' },
  { officerA: 'hist-yang-ye',       officerB: 'hist-yang-yanzhao',kind: 'parent-child' },
  { officerA: 'hist-yang-ye',       officerB: 'hist-yang-yanlang',kind: 'parent-child' },
  { officerA: 'hist-yang-ye',       officerB: 'hist-yang-yanding',kind: 'parent-child' },
  { officerA: 'hist-yang-ye',       officerB: 'hist-yang-yansi',  kind: 'parent-child' },
  { officerA: 'hist-yang-ye',       officerB: 'hist-yang-yanhui', kind: 'parent-child' },
  { officerA: 'hist-yang-yanzhao',  officerB: 'hist-yang-yanping',kind: 'sibling' },
  { officerA: 'hist-yang-yanzhao',  officerB: 'hist-yang-yansi',  kind: 'sibling' },
  { officerA: 'hist-yang-yanzhao',  officerB: 'hist-yang-zongbao',kind: 'parent-child' },
  { officerA: 'hist-yang-zongbao',  officerB: 'hist-mu-guiying',  kind: 'spouse' },
  { officerA: 'hist-yang-zongbao',  officerB: 'hist-yang-wenguang',kind: 'parent-child' },
  // 吳玠-吳璘
  { officerA: 'hist-wu-jie',        officerB: 'hist-wu-lin' as string, kind: 'sibling' },
  // 西夏 — 李德明-李元昊
  { officerA: 'hist-li-deming',     officerB: 'hist-li-yuanhao',  kind: 'parent-child' },
  // 金 — 完顏阿骨打-完顏宗翰/完顏宗弼/完顏宗望 (兄弟)
  { officerA: 'hist-aguda',         officerB: 'hist-zonghan',     kind: 'parent-child' },
  { officerA: 'hist-aguda',         officerB: 'hist-wuzhu',       kind: 'parent-child' },
  { officerA: 'hist-aguda',         officerB: 'hist-zongwang',    kind: 'parent-child' },
  { officerA: 'hist-zonghan',       officerB: 'hist-wuzhu',       kind: 'sibling' },
  { officerA: 'hist-wuzhu',         officerB: 'hist-zongwang',    kind: 'sibling' },
  { officerA: 'hist-aguda',         officerB: 'hist-wanyan-yong', kind: 'parent-child' }, // 金世宗實為阿骨打之孫,簡化

  // ─── 元 ───
  // 也速該-鐵木真 + 訶額侖 + 札木合
  { officerA: 'hist-yesugei',       officerB: 'hist-genghis',     kind: 'parent-child' },
  { officerA: 'hist-yesugei',       officerB: 'hist-hoelun',      kind: 'spouse' },
  { officerA: 'hist-hoelun',        officerB: 'hist-genghis',     kind: 'parent-child' },
  // 鐵木真-朮赤/察合台/窩闊台/拖雷
  { officerA: 'hist-genghis',       officerB: 'hist-jochi',       kind: 'parent-child' },
  { officerA: 'hist-genghis',       officerB: 'hist-chagatai',    kind: 'parent-child' },
  { officerA: 'hist-genghis',       officerB: 'hist-ogedei',      kind: 'parent-child' },
  { officerA: 'hist-genghis',       officerB: 'hist-tolui',       kind: 'parent-child' },
  { officerA: 'hist-jochi',         officerB: 'hist-chagatai',    kind: 'sibling' },
  { officerA: 'hist-jochi',         officerB: 'hist-ogedei',      kind: 'sibling' },
  { officerA: 'hist-jochi',         officerB: 'hist-tolui',       kind: 'sibling' },
  { officerA: 'hist-chagatai',      officerB: 'hist-ogedei',      kind: 'sibling' },
  { officerA: 'hist-chagatai',      officerB: 'hist-tolui',       kind: 'sibling' },
  { officerA: 'hist-ogedei',        officerB: 'hist-tolui',       kind: 'sibling' },
  // 朮赤-拔都
  { officerA: 'hist-jochi',         officerB: 'hist-batu',        kind: 'parent-child' },
  // 拖雷-蒙哥/忽必烈/旭烈兀
  { officerA: 'hist-tolui',         officerB: 'hist-mongke',      kind: 'parent-child' },
  { officerA: 'hist-tolui',         officerB: 'hist-kublai',      kind: 'parent-child' },
  { officerA: 'hist-tolui',         officerB: 'hist-hulagu',      kind: 'parent-child' },
  { officerA: 'hist-mongke',        officerB: 'hist-kublai',      kind: 'sibling' },
  { officerA: 'hist-mongke',        officerB: 'hist-hulagu',      kind: 'sibling' },
  { officerA: 'hist-kublai',        officerB: 'hist-hulagu',      kind: 'sibling' },
  { officerA: 'hist-kublai',        officerB: 'hist-zhen-jin',    kind: 'parent-child' },
  // 史天澤-史天倪 兄弟; 史塔黑父
  { officerA: 'hist-shi-taihei',    officerB: 'hist-shi-tianze',  kind: 'parent-child' },
  { officerA: 'hist-shi-taihei',    officerB: 'hist-shi-tianni',  kind: 'parent-child' },
  { officerA: 'hist-shi-tianze',    officerB: 'hist-shi-tianni',  kind: 'sibling' },

  // ─── 明 ───
  { officerA: 'hist-zhu-yuanzhang', officerB: 'hist-ma-huanghou', kind: 'spouse' },
  { officerA: 'hist-zhu-yuanzhang', officerB: 'hist-yongle',      kind: 'parent-child' },
  { officerA: 'hist-zhu-yuanzhang', officerB: 'hist-zhu-quan',    kind: 'parent-child' },
  { officerA: 'hist-zhu-yuanzhang', officerB: 'hist-zhu-yunwen',  kind: 'parent-child' }, // 朱允炆實是孫,簡化
  { officerA: 'hist-yongle',        officerB: 'hist-zhu-yunwen',  kind: 'sibling' },
  { officerA: 'hist-ma-huanghou',   officerB: 'hist-yongle',      kind: 'parent-child' },
  // 楊一清族?楊廷和-楊慎
  { officerA: 'hist-yang-tinghe',   officerB: 'hist-yang-shen',   kind: 'parent-child' },
  // 三楊
  { officerA: 'hist-yang-shiqi',    officerB: 'hist-yang-rong',   kind: 'sibling' }, // 同朝為三楊,簡化為兄弟
  { officerA: 'hist-yang-rong',     officerB: 'hist-yang-pu',     kind: 'sibling' },
  // 王世貞-王世懋
  { officerA: 'hist-wang-shizhen',  officerB: 'hist-wang-shimao', kind: 'sibling' },
  // 嚴嵩-嚴世蕃
  { officerA: 'hist-yan-song',      officerB: 'hist-yan-shifan',  kind: 'parent-child' },
  // 文徵明-文嘉
  { officerA: 'hist-wen-zhengming', officerB: 'hist-wen-jia',     kind: 'parent-child' },
  // 鄭芝龍-鄭成功-鄭克塽
  { officerA: 'hist-zheng-zhilong', officerB: 'hist-zheng-chenggong', kind: 'parent-child' },
  { officerA: 'hist-zheng-chenggong',officerB: 'hist-zheng-keshuang', kind: 'parent-child' },
  // 朱常洵 (福王) — 萬曆子, 弘光朱由崧父
  { officerA: 'hist-wanli',         officerB: 'hist-zhu-changluo',kind: 'parent-child' },
  { officerA: 'hist-wanli',         officerB: 'hist-zhu-changxun',kind: 'parent-child' },
  { officerA: 'hist-zhu-changluo',  officerB: 'hist-zhu-youxiao', kind: 'parent-child' },
  { officerA: 'hist-zhu-changluo',  officerB: 'hist-chongzhen',   kind: 'parent-child' },
  { officerA: 'hist-zhu-youxiao',   officerB: 'hist-chongzhen',   kind: 'sibling' },
  { officerA: 'hist-zhu-changxun',  officerB: 'hist-zhu-yousong', kind: 'parent-child' },

  // ─── 清 ───
  { officerA: 'hist-nurhaci',       officerB: 'hist-hong-taiji',  kind: 'parent-child' },
  { officerA: 'hist-nurhaci',       officerB: 'hist-dorgon',      kind: 'parent-child' },
  { officerA: 'hist-nurhaci',       officerB: 'hist-dodo',        kind: 'parent-child' },
  { officerA: 'hist-nurhaci',       officerB: 'hist-ajige',       kind: 'parent-child' },
  { officerA: 'hist-hong-taiji',    officerB: 'hist-dorgon',      kind: 'sibling' },
  { officerA: 'hist-hong-taiji',    officerB: 'hist-dodo',        kind: 'sibling' },
  { officerA: 'hist-hong-taiji',    officerB: 'hist-ajige',       kind: 'sibling' },
  { officerA: 'hist-dorgon',        officerB: 'hist-dodo',        kind: 'sibling' },
  { officerA: 'hist-hong-taiji',    officerB: 'hist-shunzhi',     kind: 'parent-child' },
  { officerA: 'hist-hong-taiji',    officerB: 'hist-xiaozhuang',  kind: 'spouse' },
  { officerA: 'hist-xiaozhuang',    officerB: 'hist-shunzhi',     kind: 'parent-child' },
  { officerA: 'hist-shunzhi',       officerB: 'hist-kangxi',      kind: 'parent-child' },
  { officerA: 'hist-kangxi',        officerB: 'hist-yongzheng',   kind: 'parent-child' },
  { officerA: 'hist-yongzheng',     officerB: 'hist-qianlong',    kind: 'parent-child' },
  { officerA: 'hist-qianlong',      officerB: 'hist-jiaqing',     kind: 'parent-child' },
  { officerA: 'hist-jiaqing',       officerB: 'hist-daoguang',    kind: 'parent-child' },
  { officerA: 'hist-daoguang',      officerB: 'hist-xianfeng',    kind: 'parent-child' },
  { officerA: 'hist-daoguang',      officerB: 'hist-yixin',       kind: 'parent-child' }, // 恭親王
  { officerA: 'hist-xianfeng',      officerB: 'hist-yixin',       kind: 'sibling' },
  { officerA: 'hist-xianfeng',      officerB: 'hist-tongzhi',     kind: 'parent-child' },
  { officerA: 'hist-xianfeng',      officerB: 'hist-cixi',        kind: 'spouse' },
  { officerA: 'hist-cixi',          officerB: 'hist-tongzhi',     kind: 'parent-child' },
  { officerA: 'hist-tongzhi',       officerB: 'hist-guangxu',     kind: 'sibling' },
  // 張英-張廷玉
  { officerA: 'hist-zhang-tingyu',  officerB: 'hist-zhang-ying' as string, kind: 'parent-child' },
];

export const HISTORICAL_OATHS: OathBond[] = [
  // ─── 春秋戰國 ───
  { officerA: 'hist-guan-zhong', officerB: 'hist-bao-shuya',  floor: 90, kind: 'oath', label: '管鮑之交' },
  { officerA: 'hist-fan-li',     officerB: 'hist-wen-zhong',  floor: 75, kind: 'oath', label: '越國雙傑' },
  { officerA: 'hist-lian-po',    officerB: 'hist-lin-xiangru',floor: 90, kind: 'oath', label: '將相和' },
  { officerA: 'hist-su-qin',     officerB: 'hist-zhang-yi',   floor: 60, kind: 'oath', label: '鬼谷同門' },
  { officerA: 'hist-sun-bin',    officerB: 'hist-pang-juan',  floor: 30, kind: 'oath', label: '鬼谷同門' },
  { officerA: 'hist-guiguzi',    officerB: 'hist-su-qin',     floor: 95, kind: 'oath', label: '鬼谷師徒' },
  { officerA: 'hist-guiguzi',    officerB: 'hist-zhang-yi',   floor: 95, kind: 'oath', label: '鬼谷師徒' },
  { officerA: 'hist-guiguzi',    officerB: 'hist-sun-bin',    floor: 95, kind: 'oath', label: '鬼谷師徒' },
  { officerA: 'hist-guiguzi',    officerB: 'hist-pang-juan',  floor: 95, kind: 'oath', label: '鬼谷師徒' },
  { officerA: 'hist-laozi',      officerB: 'hist-confucius',  floor: 70, kind: 'oath', label: '問道之交' },
  { officerA: 'hist-confucius',  officerB: 'hist-yan-hui',    floor: 95, kind: 'oath', label: '孔門師徒' },
  { officerA: 'hist-confucius',  officerB: 'hist-zigong',     floor: 95, kind: 'oath', label: '孔門師徒' },
  { officerA: 'hist-confucius',  officerB: 'hist-zilu',       floor: 95, kind: 'oath', label: '孔門師徒' },
  { officerA: 'hist-confucius',  officerB: 'hist-ziyou',      floor: 95, kind: 'oath', label: '孔門師徒' },
  { officerA: 'hist-confucius',  officerB: 'hist-zizhang',    floor: 95, kind: 'oath', label: '孔門師徒' },
  { officerA: 'hist-confucius',  officerB: 'hist-zhonggong',  floor: 95, kind: 'oath', label: '孔門師徒' },
  { officerA: 'hist-confucius',  officerB: 'hist-ranqiu',     floor: 95, kind: 'oath', label: '孔門師徒' },
  { officerA: 'hist-confucius',  officerB: 'hist-zaiwo',      floor: 95, kind: 'oath', label: '孔門師徒' },
  { officerA: 'hist-confucius',  officerB: 'hist-shang-qu',   floor: 95, kind: 'oath', label: '孔門師徒' },
  { officerA: 'hist-huangshigong', officerB: 'hist-zhang-liang', floor: 95, kind: 'oath', label: '圯下授書' },
  { officerA: 'hist-shang-yang', officerB: 'hist-qin-xiaogong',floor: 95, kind: 'oath', label: '變法君臣' },
  { officerA: 'hist-yue-yi',     officerB: 'hist-yan-zhaowang',floor: 95, kind: 'oath', label: '黃金台' },
  { officerA: 'hist-jing-ke',    officerB: 'hist-taizi-dan',  floor: 95, kind: 'oath', label: '荊軻刺秦' },
  { officerA: 'hist-jing-ke',    officerB: 'hist-gao-jianli', floor: 95, kind: 'oath', label: '燕市知音' },
  { officerA: 'hist-jing-ke',    officerB: 'hist-fan-yuqi',   floor: 85, kind: 'oath', label: '項上人頭' },
  { officerA: 'hist-xinling-jun',officerB: 'hist-zhu-hai',    floor: 85, kind: 'oath', label: '信陵三士' },
  { officerA: 'hist-xinling-jun',officerB: 'hist-hou-ying',   floor: 90, kind: 'oath', label: '信陵三士' },

  // ─── 楚漢 ───
  { officerA: 'hist-xiao-he',    officerB: 'hist-han-xin',    floor: 90, kind: 'oath', label: '蕭何月下追韓信' },
  { officerA: 'hist-fan-zeng',   officerB: 'hist-xiang-yu',   floor: 80, kind: 'oath', label: '亞父' },
  { officerA: 'hist-zhang-liang',officerB: 'hist-liu-bang',   floor: 95, kind: 'oath', label: '運籌帷幄' },
  { officerA: 'hist-han-xin',    officerB: 'hist-liu-bang',   floor: 75, kind: 'oath', label: '兵仙與沛公' },
  { officerA: 'hist-xiao-he',    officerB: 'hist-liu-bang',   floor: 95, kind: 'oath', label: '沛縣同鄉' },
  { officerA: 'hist-fan-kuai',   officerB: 'hist-liu-bang',   floor: 95, kind: 'oath', label: '沛縣同鄉' },
  { officerA: 'hist-cao-can',    officerB: 'hist-liu-bang',   floor: 95, kind: 'oath', label: '沛縣同鄉' },
  { officerA: 'hist-zhou-bo',    officerB: 'hist-liu-bang',   floor: 95, kind: 'oath', label: '沛縣同鄉' },
  { officerA: 'hist-zhou-bo',    officerB: 'hist-chen-ping',  floor: 85, kind: 'oath', label: '安劉誅呂' },

  // ─── 兩漢 ───
  { officerA: 'hist-wei-qing',   officerB: 'hist-huo-qubing', floor: 95, kind: 'clan', label: '舅甥同征' },

  // ─── 兩晉 ───
  { officerA: 'hist-zu-ti',      officerB: 'hist-liu-kun',    floor: 90, kind: 'oath', label: '聞雞起舞' },
  { officerA: 'hist-ji-kang',    officerB: 'hist-ruan-ji',    floor: 85, kind: 'oath', label: '竹林七賢' },
  { officerA: 'hist-ji-kang',    officerB: 'hist-shan-tao',   floor: 70, kind: 'oath', label: '竹林七賢' },
  { officerA: 'hist-ji-kang',    officerB: 'hist-liu-ling',   floor: 80, kind: 'oath', label: '竹林七賢' },
  { officerA: 'hist-ji-kang',    officerB: 'hist-ruan-xian',  floor: 80, kind: 'oath', label: '竹林七賢' },
  { officerA: 'hist-ji-kang',    officerB: 'hist-wang-rong',  floor: 70, kind: 'oath', label: '竹林七賢' },
  { officerA: 'hist-fu-jian',    officerB: 'hist-wang-meng',  floor: 95, kind: 'oath', label: '君臣相得' },

  // ─── 唐 ───
  { officerA: 'hist-tang-taizong',officerB: 'hist-wei-zheng', floor: 90, kind: 'oath', label: '人鏡之諫' },
  { officerA: 'hist-tang-taizong',officerB: 'hist-fang-xuanling', floor: 95, kind: 'oath', label: '貞觀君臣' },
  { officerA: 'hist-tang-taizong',officerB: 'hist-du-ruhui',  floor: 95, kind: 'oath', label: '房謀杜斷' },
  { officerA: 'hist-fang-xuanling', officerB: 'hist-du-ruhui', floor: 95, kind: 'oath', label: '房謀杜斷' },
  { officerA: 'hist-tang-taizong',officerB: 'hist-li-jing',   floor: 95, kind: 'oath', label: '貞觀軍神' },
  { officerA: 'hist-qin-qiong',  officerB: 'hist-yuchi-gong', floor: 90, kind: 'oath', label: '門神二將' },
  { officerA: 'hist-li-bai',     officerB: 'hist-du-fu',      floor: 80, kind: 'oath', label: '詩仙詩聖' },
  { officerA: 'hist-li-bai',     officerB: 'hist-he-zhizhang',floor: 85, kind: 'oath', label: '謫仙人' },
  { officerA: 'hist-zhang-xun',  officerB: 'hist-yan-gaoqing',floor: 95, kind: 'oath', label: '安史殉節' },
  { officerA: 'hist-zhang-xun',  officerB: 'hist-yan-zhenqing',floor: 85, kind: 'oath', label: '安史殉節' },

  // ─── 五代 ───
  { officerA: 'hist-li-keyong',  officerB: 'hist-li-cunxiao', floor: 95, kind: 'oath', label: '義父養子' },

  // ─── 宋 ───
  { officerA: 'hist-yue-fei',    officerB: 'hist-niu-gao',    floor: 95, kind: 'oath', label: '岳家軍' },
  { officerA: 'hist-yue-fei',    officerB: 'hist-han-shizhong',floor: 80, kind: 'oath', label: '南宋雙璧' },
  { officerA: 'hist-yue-fei',    officerB: 'hist-zong-ze',    floor: 90, kind: 'oath', label: '宗澤識岳' },
  { officerA: 'hist-fan-zhongyan',officerB: 'hist-han-qi',    floor: 80, kind: 'oath', label: '慶曆君子' },
  { officerA: 'hist-fan-zhongyan',officerB: 'hist-ouyang-xiu',floor: 80, kind: 'oath', label: '慶曆君子' },
  { officerA: 'hist-wang-anshi', officerB: 'hist-zhang-dun',  floor: 75, kind: 'oath', label: '新黨同志' },
  { officerA: 'hist-sima-guang', officerB: 'hist-ouyang-xiu', floor: 75, kind: 'oath', label: '舊黨同志' },
  { officerA: 'hist-su-shi',     officerB: 'hist-su-zhe',     floor: 95, kind: 'clan', label: '蘇門兄弟' },
  { officerA: 'hist-su-shi',     officerB: 'hist-huang-tingjian',floor: 85, kind: 'oath', label: '蘇門四學士' },
  { officerA: 'hist-su-shi',     officerB: 'hist-qin-guan',   floor: 85, kind: 'oath', label: '蘇門四學士' },

  // ─── 元 ───
  { officerA: 'hist-genghis',    officerB: 'hist-muqali',     floor: 95, kind: 'oath', label: '四傑之首' },
  { officerA: 'hist-genghis',    officerB: 'hist-jebe',       floor: 95, kind: 'oath', label: '四犬' },
  { officerA: 'hist-genghis',    officerB: 'hist-subutai',    floor: 95, kind: 'oath', label: '四犬' },
  { officerA: 'hist-genghis',    officerB: 'hist-jamuqa',     floor: 60, kind: 'oath', label: '安答結義' },

  // ─── 明 ───
  { officerA: 'hist-zhu-yuanzhang',officerB: 'hist-xu-da',    floor: 95, kind: 'oath', label: '濠州起兵' },
  { officerA: 'hist-zhu-yuanzhang',officerB: 'hist-chang-yuchun',floor: 95, kind: 'oath', label: '濠州起兵' },
  { officerA: 'hist-zhu-yuanzhang',officerB: 'hist-tang-he',  floor: 90, kind: 'oath', label: '濠州同鄉' },
  { officerA: 'hist-zhu-yuanzhang',officerB: 'hist-liu-bowen',floor: 90, kind: 'oath', label: '謀主與帝' },
  { officerA: 'hist-xu-da',      officerB: 'hist-chang-yuchun',floor: 95, kind: 'oath', label: '左右將軍' },
  { officerA: 'hist-qi-jiguang', officerB: 'hist-yu-dayou',   floor: 90, kind: 'oath', label: '抗倭雙傑' },
  { officerA: 'hist-qi-jiguang', officerB: 'hist-tan-lun',    floor: 85, kind: 'oath', label: '抗倭戰友' },
  { officerA: 'hist-yongle',     officerB: 'hist-zheng-he',   floor: 95, kind: 'oath', label: '燕王舊部' },
  { officerA: 'hist-yongle',     officerB: 'hist-yao-guangxiao',floor: 95, kind: 'oath', label: '靖難謀主' },
  { officerA: 'hist-li-dingguo', officerB: 'hist-sun-kewang', floor: 50, kind: 'oath', label: '大西舊部' },

  // ─── 清 ───
  { officerA: 'hist-kangxi',     officerB: 'hist-zhou-peigong',floor: 90, kind: 'oath', label: '平三藩君臣' },
  { officerA: 'hist-zeng-guofan',officerB: 'hist-zuo-zongtang',floor: 80, kind: 'oath', label: '湘軍同志' },
  { officerA: 'hist-zeng-guofan',officerB: 'hist-li-hongzhang',floor: 85, kind: 'oath', label: '師生之誼' },
  { officerA: 'hist-zeng-guofan',officerB: 'hist-hu-linyi',   floor: 90, kind: 'oath', label: '湘軍祖' },
  { officerA: 'hist-tan-sitong', officerB: 'hist-kang-youwei',floor: 80, kind: 'oath', label: '戊戌變法' },
  { officerA: 'hist-tan-sitong', officerB: 'hist-liang-qichao',floor: 90, kind: 'oath', label: '戊戌變法' },
  { officerA: 'hist-tan-sitong', officerB: 'hist-yang-rui',   floor: 95, kind: 'oath', label: '戊戌六君子' },
  { officerA: 'hist-tan-sitong', officerB: 'hist-lin-xu',     floor: 95, kind: 'oath', label: '戊戌六君子' },
  { officerA: 'hist-tan-sitong', officerB: 'hist-liu-guangdi',floor: 95, kind: 'oath', label: '戊戌六君子' },
  { officerA: 'hist-tan-sitong', officerB: 'hist-yang-shenxiu',floor: 95, kind: 'oath', label: '戊戌六君子' },
  { officerA: 'hist-tan-sitong', officerB: 'hist-kang-guangren' as string, floor: 95, kind: 'oath', label: '戊戌六君子' },
];
