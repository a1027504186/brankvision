import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vinext()],
  build: {
    rolldownOptions: {
      external: ["cloudflare:workers"],
    },
  },
});
