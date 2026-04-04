import { defineConfig } from "bunup";

export default defineConfig({
  entry: "./packages/core/src/index.ts",
  outDir: "./dist",
  format: "esm",
  target: "node",
  dts: true,
  minify: true,
});
