// FONT THEME: the one place that controls the fonts of the whole store.
//
//   'classic'   exactly how the store looked before (Playfair Display + Inter, Amiri + Tajawal)
//   'logo'      DM Serif Display + DM Sans (Arabic: Reem Kufi + Tajawal). Heavy, high-contrast headings like the "20's" logo.
//   'boutique'  Bodoni Moda + Jost (Arabic: unchanged). Thin and elegant, like a fashion magazine.
//
// To go back to the original look: change FONT_THEME to 'classic'. (Or delete the 3 "font theme" lines in main.jsx.)
// Nothing else in the project was changed for this: index.css, tailwind.config.js and index.html are untouched.
export const FONT_THEME = 'classic'

const PRESETS = {
  logo: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=Reem+Kufi:wght@500;600;700&display=swap',
  boutique: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..900&family=Jost:wght@400;500;600&display=swap',
}

// Marks <html data-fonts="..."> (the CSS in styles/fonts-presets.css reacts to it) and loads that theme's fonts.
export function applyFontTheme() {
  const href = PRESETS[FONT_THEME]
  document.documentElement.dataset.fonts = href ? FONT_THEME : 'classic'
  if (!href) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.fontTheme = FONT_THEME
  document.head.appendChild(link)
}
