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
 *   fps       2000  幀率計(永遠最上)
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
  fps: 2000,
} as const;
