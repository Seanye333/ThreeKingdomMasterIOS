/**
 * Z 軸層級表 — the ONE ladder every fixed-position layer sits on. New
 * overlays pick a rung here instead of inventing a number; keep gaps for
 * future insertions.
 *
 *   panel      200  城市/部落側板
 *   modal      600  一般彈窗(Modal wrapper / 手寫背板)
 *   dayflow    640  日流控制條
 *   modalHigh  900  疊在面板之上的功能窗(計略/祭祀/災異志…)
 *   relief     920  賑災待決
 *   palette    950  命令臺 / 安裝提示
 *   tutorial   970  教學浮層
 *   toast      985  成就/稱號/事件 toast(蓋過教學,不蓋結局)
 *   endings    990  勝敗結局
 *   battle    1500  全屏戰鬥
 *   dropdown  1990  下拉選單(portal 出去的,必須蓋過開啟它的那一層)
 *   tip       1993  懸停提示(可能貼在下拉項上,故高於 dropdown)
 *   handoff   1996  熱座換手遮罩(遮蔽一切,不能讓下一位看見上一位的盤面)
 *   fps       2000  幀率計(永遠最上)
 *
 * 這張表原本沒有任何檔案 import —— 一份沒人遵守的公約比沒有公約更危險
 * (查的時候 HudMenu 用的是 9999,恰好違反表上唯一寫死的不變量「fps 永遠最上」)。
 * 現在最容易互相蓋錯的幾層改成從這裡取值,並由 zIndex.test.ts 釘住排序。
 */
export const Z = {
  panel: 200,
  modal: 600,
  dayflow: 640,
  modalHigh: 900,
  relief: 920,
  palette: 950,
  tutorial: 970,
  toast: 985,
  endings: 990,
  battle: 1500,
  dropdown: 1990,
  tip: 1993,
  handoff: 1996,
  fps: 2000,
} as const;
