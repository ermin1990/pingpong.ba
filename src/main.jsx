import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/index.css'
import { App } from './app.jsx'
import { ThemeProvider } from './themes/ThemeContext.jsx'
import './themes/animations.css'
import './themes/theme-overrides.css'

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
