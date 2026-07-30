import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'

// The duel folder holds many Mixamo packs (~259MB) kept on disk for future use,
// but only a few are loaded at runtime: the 3D duel uses the Sword-and-Shield
// and Great-Sword packs (+ a few standalone clips); the 3D 舌戰 (DebateArena3D)
// uses the Pro-Magic and Gestures packs. This prunes the rest from the BUILD
// OUTPUT (dist only — source files are never touched) so iOS/Vercel ship a
// fraction of the 259MB. Keep these in sync with duelAssets.ts + debateAssets.ts.
function pruneUnusedDuelPacks(): Plugin {
  // Keep in sync with duelAssets.ts + debateAssets.ts. The duel uses Sword/Great
  // + the Axe pack (斧 class & the shared 挑釁/突刺/連擊/缴械 clips) + the Longbow
  // pack (弓 class & roll/sidestep evades); the 舌戰 uses Pro-Magic + Gestures.
  const KEEP_DIRS = new Set(['Sword and Shield Pack', 'Great Sword Pack', 'Pro Melee Axe Pack-2', 'Pro Longbow Pack', 'Pro Magic Pack', 'Gestures Pack Basic'])
  // Standalone clips (evades/jump) + the character mesh, by basename.
  const KEEP_STANDALONE = new Set(['X Bot', 'Dodging', 'Quick Roll To Run', 'Jump'])

  // Since 2026-07 the game loads .glb (Draco), not .fbx — see DUEL_FORMAT.
  // The .fbx originals stay in the repo as the conversion source but must never
  // reach the build: they are 4.3× the size of what we actually ship.
  const dropFbxIn = async (dir: string): Promise<number> => {
    let entries
    try { entries = await readdir(dir, { withFileTypes: true }) } catch { return 0 }
    let freed = 0
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isDirectory()) { freed += await dropFbxIn(full); continue }
      if (!e.name.endsWith('.fbx')) continue
      try { freed += (await stat(full)).size } catch { /* ignore */ }
      await rm(full, { force: true })
    }
    return freed
  }

  return {
    name: 'prune-unused-duel-packs',
    apply: 'build',
    async closeBundle() {
      const dir = join('dist', 'models', 'duel')
      let entries
      try { entries = await readdir(dir, { withFileTypes: true }) } catch { return }
      let freed = 0
      for (const e of entries) {
        const full = join(dir, e.name)
        const base = e.name.replace(/\.(fbx|glb)$/, '')
        const drop = e.isDirectory()
          ? !KEEP_DIRS.has(e.name)
          : e.name.endsWith('.glb') && !KEEP_STANDALONE.has(base)
        if (!drop) continue
        try { freed += await dirSize(full) } catch { /* ignore */ }
        await rm(full, { recursive: true, force: true })
      }
      // Whatever survived above still carries its .fbx sources — strip them.
      freed += await dropFbxIn(dir)
      if (freed > 0) console.log(`\n[prune-duel-packs] removed ~${(freed / 1024 / 1024).toFixed(0)}MB of unused/source duel assets from dist`)
    },
  }
}

async function dirSize(p: string): Promise<number> {
  const s = await stat(p)
  if (!s.isDirectory()) return s.size
  let total = 0
  for (const e of await readdir(p)) total += await dirSize(join(p, e))
  return total
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves from /<repo>/ — set only by the deploy workflow so
  // local dev, preview and the E2E webServer keep plain '/'.
  base: process.env.GHPAGES ? '/three-kingdom-masters/' : '/',
  plugins: [
    react(),
    pruneUnusedDuelPacks(),
    // PWA — installable on phone home screens (fullscreen, offline-capable)
    // and as a desktop app window; the browser experience is unchanged.
    VitePWA({
      registerType: 'autoUpdate', // new deploys replace stale caches automatically
      includeAssets: ['favicon.svg', 'map-bg.jpg'],
      manifest: {
        name: '千古群英傳 Warlords Eternal',
        short_name: '千古群英傳',
        description: 'RTK-style grand strategy — one world from the realm map down to the battlefield.',
        theme_color: '#1a1410',
        background_color: '#0a0805',
        display: 'fullscreen',
        // Landscape is the immersive experience (MapScreen nudges you there the
        // first time you rotate), but portrait is fully playable — so don't lock
        // it. This mirrors UISupportedInterfaceOrientations in gen/apple/project.yml;
        // keep the two in sync or the PWA and the iOS build disagree.
        orientation: 'any',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The main bundle is ~5MB — well past workbox's 2MB default cap.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Portraits load lazily in bulk — cache them as they're seen instead
        // of precaching hundreds of images up front.
        runtimeCaching: [
          {
            urlPattern: /\/portraits\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tkm-portraits',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
      // Never let the service worker interfere with dev.
      devOptions: { enabled: false },
    }),
  ],
})
