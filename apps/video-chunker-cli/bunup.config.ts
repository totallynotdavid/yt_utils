import { defineConfig } from 'bunup'

export default defineConfig({
  entry: 'src/bin.ts',
  outDir: 'dist',
  format: 'esm',
  target: 'node',
  dts: false,
  minify: true,
})
