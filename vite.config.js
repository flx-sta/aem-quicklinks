import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import zipPack from "vite-plugin-zip-pack";
import { readFileSync } from "fs";
import pkg from "./package.json";

const manifest = JSON.parse(
  readFileSync(new URL("./src/manifest.json", import.meta.url), "utf-8"),
);
// const pkg = JSON.parse(
//   readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
// );

manifest.version = pkg.version;

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
      outFileName: `aem-quicklinks-${pkg.version}.xpi`,
    }),
  ],
});
