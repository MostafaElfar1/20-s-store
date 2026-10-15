/** @type {import('tailwindcss').Config} */
// Palette taken from icon.png: deep forest green (#103C21) and pale sage (#BDD1C5).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#103C21', hover: '#1B5733', deep: '#0B2B17' },
        sage: { DEFAULT: '#BDD1C5', soft: '#EAF0EB', mid: '#9DB8A8' },
        cream: '#F7F5EF',   // page background
        paper: '#FFFFFF',   // cards
        ink: '#14231A',     // main text
        muted: '#5C6C62',
        line: '#E1E7E0',
        danger: '#B3402D',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,60,33,.05), 0 8px 24px -12px rgba(16,60,33,.14)',
        lift: '0 2px 4px rgba(16,60,33,.06), 0 18px 36px -16px rgba(16,60,33,.24)',
      },
    },
  },
  plugins: [],
}
