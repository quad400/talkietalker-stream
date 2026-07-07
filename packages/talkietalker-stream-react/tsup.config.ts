import { defineConfig } from "tsup"
import { visualizer } from "rollup-plugin-visualizer"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "room/index": "src/room/index.ts",
    "signaling/index": "src/signaling/index.ts",
    "webrtc/index": "src/webrtc/index.ts",
    "media/index": "src/media/index.ts",
    "core/index": "src/core/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  esbuildOptions(options) {
    options.jsx = "automatic"
  },
  plugins: [
    visualizer({
      filename: "dist/bundle-stats.html",
      gzipSize: true,
      open: false,
    }),
  ],
})
