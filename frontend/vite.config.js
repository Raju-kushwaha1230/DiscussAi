import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import babel from 'vite-plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
//     babel({
//       babelConfig: {
//         plugins: ['babel-plugin-react-compiler'],
//       },
// }),

  ],
})
