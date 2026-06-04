import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import zipPack from "vite-plugin-zip-pack";
import manifest from "./src/manifest.json";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  plugins: [
    crx({ manifest }),
    zipPack({
      inDir: "dist",
      outDir: "dist",
      outFileName: "aem-quicklinks.xpi",
    }),
  ],
});
