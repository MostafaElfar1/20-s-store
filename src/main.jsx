import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
// --- font theme (3 lines; delete them, or set FONT_THEME = 'classic' in src/fontTheme.js, to go back) ---
import './styles/fonts-presets.css'
import { applyFontTheme } from './fontTheme'
applyFontTheme()
// ----------------------------------------------------------------------------------------------

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
