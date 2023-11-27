import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isCI = process.env.CI === 'true'

// https://vitejs.dev/config/
export default defineConfig({
  base:  isCI ? process.env.GH_REPOSITORY.split('/').pop() : undefined,
  plugins: [react()],
})
