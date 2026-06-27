# 選戰役 · 圖片素材(Title hero + scenario covers)

兩個槽位,都是**有圖用圖、缺圖走原樣**(放檔即生效,不崩):

| 用途 | 檔名 | 缺檔時 |
|---|---|---|
| **標題大背景** | `public/title-hero.jpg` | 只剩原本的漸變+山影底(不變) |
| **戰役封面** | `public/scenarios/<scenarioId>.jpg` | 只顯示右側 MiniMap 疆域圖(不變) |

- 規格同弹窗:**16:9,~1400px 寬,JPEG q≈82**。壓縮:
  `sips -s format jpeg -s formatOptions 82 --resampleWidth 1400 in.png --out <檔名>`
- 封面顯示在「選戰役」右側、**MiniMap 上方**(minimap 一直都在)。
- 標題背景會被**壓暗到 50%** 墊在選單後面,所以選**主體偏側/中間留白**的構圖,字才壓得住。

---

## 戰役 id ↔ 檔名 全表(86)

封面檔名 = `public/scenarios/<id>.jpg`。先做想要的,其餘自動走 minimap。

### 三國(184–280)
| id(檔名) | 名稱 | 年 |
|---|---|---|
| `scn-184-yellow-turban` | 黃巾之亂 | 184 |
| `scn-189-eunuchs` | 十常侍之亂 | 189 |
| `scn-190-anti-dong-zhuo` | 反董卓聯軍 | 190 |
| `scn-192-wangyun` | 王允連環計 | 192 |
| `scn-194-xuzhou` | 徐州牧 | 194 |
| `scn-195-jiangdong` | 孫策定江東 | 195 |
| `scn-197-bohai` | 渤海戰線 | 197 |
| `scn-198-xiapi` | 下邳之圍 | 198 |
| `scn-199-yijing` | 易京之戰 | 199 |
| `scn-200-guandu` | 官渡之戰 | 200 |
| `scn-204-yecheng` | 鄴城陷落 | 204 |
| `scn-207-three-visits` | 三顧茅廬 | 207 |
| `scn-207-bailang` | 白狼山·北征烏桓 | 207 |
| `scn-208-chibi` | 赤壁之戰 | 208 |
| `scn-211-weinan` | 渭南之戰 | 211 |
| `scn-213-fengpo` | 落鳳坡 | 213 |
| `scn-214-xichuan` | 入主西川 | 214 |
| `scn-215-hefei` | 合肥之戰 | 215 |
| `scn-218-dingjun` | 定軍山·漢中之戰 | 218 |
| `scn-219-hanzhong` | 漢中王 | 219 |
| `scn-220-declaration` | 三國鼎立 | 220 |
| `scn-221-shu-emperor` | 蜀漢建國 | 221 |
| `scn-222-yiling` | 夷陵之戰 | 222 |
| `scn-225-southern` | 南征之役 | 225 |
| `scn-228-jieting` | 街亭之戰 | 228 |
| `scn-228-shiting` | 石亭之戰 | 228 |
| `scn-229-three-emperors` | 三帝鼎立 | 229 |
| `scn-231-lucheng` | 鹵城之戰 | 231 |
| `scn-234-wuzhang` | 五丈原 | 234 |
| `scn-238-liaodong` | 遼東·襄平之戰 | 238 |
| `scn-241-shaopi` | 吳攻魏·芍陂之戰 | 241 |
| `scn-244-xingshi` | 興勢之戰 | 244 |
| `scn-249-gaopingling` | 高平陵之變 | 249 |
| `scn-252-dongxing` | 東興之戰 | 252 |
| `scn-253-hefei` | 合肥新城之戰 | 253 |
| `scn-255-huainan2` | 淮南二叛·毌丘儉文欽之亂 | 255 |
| `scn-257-huainan3` | 淮南三叛·諸葛誕之亂 | 257 |
| `scn-263-shu-fall` | 滅蜀之役 | 263 |
| `scn-264-zhonghui` | 鍾會之亂 | 264 |
| `scn-265-jin-founded` | 司馬炎篡魏 | 265 |
| `scn-272-xiling` | 西陵之戰 | 272 |
| `scn-280-jin-unite` | 晉滅吳 | 280 |

### 戰國
| id | 名稱 |
|---|---|
| `scn-ws-seven` | 戰國七雄·逐鹿 |
| `scn-ws-weiwen` | 戰國·魏文侯首霸 |
| `scn-ws-shangyang` | 戰國·商鞅變法 |
| `scn-ws-guiling` | 戰國·圍魏救趙 |
| `scn-ws-hangu` | 戰國·五國攻秦 |
| `scn-ws-yique` | 戰國·伊闕之戰 |
| `scn-ws-yanying` | 戰國·鄢郢之戰 |
| `scn-ws-yuyu` | 戰國·閼與之戰 |
| `scn-ws-qimin` | 戰國·齊湣王稱帝 |
| `scn-ws-yueyi` | 戰國·樂毅伐齊 |
| `scn-ws-changping` | 戰國·長平之戰 |
| `scn-ws-handan` | 戰國·邯鄲之戰 |
| `scn-ws-tiandan` | 戰國·田單復國 |
| `scn-ws-qin-unify` | 戰國·秦滅六國 |

### 楚漢
| id | 名稱 |
|---|---|
| `scn-ch-daze` | 大澤鄉起義 |
| `scn-ch-julu` | 鉅鹿之戰 |
| `scn-ch-chuhan` | 楚漢爭霸 |
| `scn-ch-sanqin` | 楚漢·還定三秦 |
| `scn-ch-pengcheng` | 楚漢·彭城之戰 |
| `scn-ch-weishui` | 楚漢·濰水之戰 |
| `scn-ch-jingxing` | 楚漢·井陘之戰 |
| `scn-ch-gaixia` | 楚漢·垓下之戰 |

### 隋唐
| id | 名稱 |
|---|---|
| `scn-st-suiend` | 隋末群雄逐鹿 |
| `scn-st-qianshui` | 隋唐·淺水原之戰 |
| `scn-st-bobi` | 隋唐·柏壁之戰 |
| `scn-st-hulao` | 隋唐·虎牢之戰 |
| `scn-st-anshi` | 安史之亂 |

### 假想 What-if
| id | 名稱 |
|---|---|
| `scn-gathering-of-heroes` | 英雄集結 |
| `scn-whatif-guanyu-jing` | 關羽守住荊州 |
| `scn-whatif-zhuge-lives` | 諸葛亮活到八十 |
| `scn-whatif-cao-wins-chibi` | 曹操贏赤壁 |
| `scn-whatif-women` | 女傑時代 |
| `scn-whatif-yuan-guandu` | 若袁紹勝官渡 |
| `scn-whatif-lubu-xuzhou` | 若呂布割據徐州 |
| `scn-whatif-machao-guanzhong` | 若馬超盡得關中 |
| `scn-whatif-sunce-lives` | 若孫策不死 |
| `scn-whatif-dong-lives` | 若董卓未亡 |
| `scn-whatif-yuanshu-empire` | 若袁術稱帝成 |
| `scn-whatif-guojia-lives` | 若郭嘉不死 |
| `scn-whatif-zhouyu-lives` | 若周瑜不死 |
| `scn-whatif-pangtong-lives` | 若龐統不死 |
| `scn-whatif-guanyu-north` | 若關羽威震華夏 |
| `scn-whatif-gaopingling` | 若曹爽先發制人 |
| `scn-whatif-luxun-lives` | 若陸遜不冤死 |
