import { defineConfig } from 'vite'
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: './lib/index.ts',
      name: 'mithraeum-banners-scene',
      fileName: 'MithraeumBannersScene'
    }
  }
})
