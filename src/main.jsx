import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/index.css'
import { App } from './app.jsx'
import { ThemeProvider } from './themes/ThemeContext.jsx'
import './themes/animations.css'
import './themes/theme-overrides.css'

// After a new deploy, lazy-loaded route chunks from an already-open tab can 404
// (their content hash no longer exists on the server). Vite fires this event when
// that happens - reload once to pick up the fresh build instead of leaving a broken page.
window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('vite-reloaded-on-preload-error')) {
    sessionStorage.setItem('vite-reloaded-on-preload-error', '1');
    window.location.reload();
  }
});
window.addEventListener('load', () => sessionStorage.removeItem('vite-reloaded-on-preload-error'));

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
