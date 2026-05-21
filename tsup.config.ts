import { defineConfig, type Options } from "tsup";

export function createTsupConfig(options: Options = {}) {
  return defineConfig({
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    platform: "node",
    target: "esnext",
    ...options,
  });
}
