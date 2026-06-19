# 桌面版 (Tauri)

原生 Mac/Windows/Linux 桌面 App 外殼。網頁版照常獨立運作;這個目錄只在打包桌面版時用到。

## 一次性準備
1. 安裝 Rust:`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. (macOS) `xcode-select --install`

## 開發 / 打包
- `npm run tauri:dev` — 桌面窗口 + 熱更新
- `npm run tauri:build` — 產出 .app / .dmg(在 `src-tauri/target/release/bundle/`)
