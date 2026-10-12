/** @type {import('tailwindcss').Config} */
// Palette taken straight from icon.png:
//   moss  #103c21  (the arch background)
//   sage  #bdd1c5  (the "20's" lettering)
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#0a2616',          // page background (a step darker than the logo green)
        moss: '#103c21',            // surfaces: navbar, cards, footer (exact logo green)
        sage: { DEFAULT: '#bdd1c5', hover: '#d9e7de' }, // accent / buttons / links
        mist: '#eef3ef',            // main text
        muted: '#8fa99a',           // secondary text
        line: '#255c3a',            // borders
      },
      fontFamily: {
        display: ['"Bodoni Moda"', '"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
