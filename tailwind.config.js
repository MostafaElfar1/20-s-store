/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0D',
        charcoal: '#151518',
        gold: { DEFAULT: '#C6A15B', hover: '#E0BE78' },
        ivory: '#F5F0E8',
        muted: '#A7A29A',
        line: '#2A2A2E',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
