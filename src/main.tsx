import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, getStoredTheme } from './ui/theme'
import { applyUiPrefs, getStoredUiPrefs } from './ui/uiPrefs'

applyTheme(getStoredTheme());
applyUiPrefs(getStoredUiPrefs());

// 陳舊資產自癒 — after a new deploy an already-open tab still references the old
// chunk hashes; the first lazy import then 404s ("Unable to preload CSS for …").
// Reload once to pull the fresh manifest. A sessionStorage guard prevents a
// reload loop when the asset is genuinely gone (offline / real 404) — there the
// ErrorBoundary's Retry/Reload takes over instead.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('tkm-stale-reload')) return;
  sessionStorage.setItem('tkm-stale-reload', '1');
  window.location.reload();
});
// Clear the guard a few seconds after a clean boot, so a *future* deploy can
// self-heal again rather than being permanently suppressed.
window.addEventListener('load', () => {
  window.setTimeout(() => sessionStorage.removeItem('tkm-stale-reload'), 5000);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
