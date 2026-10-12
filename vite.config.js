import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' = relative asset paths, so the build works under any GitHub Pages
// repo subpath (https://user.github.io/repo-name/) without knowing the repo name.
export default defineConfig({
  base: './',
  plugins: [react()],
})
