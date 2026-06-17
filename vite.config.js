import { defineConfig } from "vite";

export default defineConfig({
  base: "/cg-final/",
  build: {
    rollupOptions: {
      input: {
        index: "./index.html",
      }
    }
  }
});
